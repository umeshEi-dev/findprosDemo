import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, OnChanges, SimpleChanges } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { Category } from '../../../core/models/category.model';
import { CategoryApiService } from '../../../core/services/category-api.service';
import { Task } from '../../../core/models/task.model';
import { Location, ZipcodeResult, ZipcodePricing } from '../../../core/models/location.model';

type AddMode = 'category' | 'task';
type ZipPriceField = 'leads' | 'warm_transfers' | 'inbounds';
type BulkSnapshotItem = { index: number; prices: Record<ZipPriceField, number> };
interface SavedTaskLocation {
  location?: string;
  city?: string;
  state?: string;
  type?: string;
  service_area_zipcodes?: ZipcodePricing[];
}

@Component({
  selector: 'app-add-edit-modal',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-edit-modal.html',
  styleUrl: './add-edit-modal.css'
})
export class AddEditModalComponent implements OnChanges {
  @Input() categories: Category[] = [];
  @Input() tasks: Task[] = [];
  @Input() editItem?: { kind: 'category' | 'task'; data: any };
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(CategoryApiService);

  mode: AddMode = 'category';
  saving = false;
  errorMessage = '';

  // ─── Location Search State ───────────────────────────
  locationSearchText = '';
  locationResults: Location[] = [];
  locationSearching = false;
  selectedLocation: Location | null = null;

  // ─── Zipcode State ───────────────────────────────────
  zipcodes: ZipcodePricing[] = [];
  zipcodesLoading = false;
  bulkLeads = 0;
  bulkWarmTransfers = 0;
  bulkInbounds = 0;
  bulkApplyMessage = '';
  private bulkMessageTimer: ReturnType<typeof setTimeout> | null = null;
  private lastBulkSnapshot: BulkSnapshotItem[] = [];

  // ─── Location Panel toggle ───────────────────────────
  showLocationPanel = false;

  // Search debounce
  private readonly searchSubject = new Subject<string>();

  readonly categoryForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    categoryId: ['', Validators.required],
    description: ['']
  });

  readonly taskForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(160)]],
    categoryIds: this.fb.control<string[]>([], Validators.required),
    description: [''],
    priceLead: [''],
    priceCall: [''],
    priceAppointment: ['']
  });

  constructor() {
    // Debounce search — 400ms baad call hoga
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(search => {
        if (!search.trim()) {
          this.locationResults = [];
          return of([]);
        }
        this.locationSearching = true;
        return this.api.getLocation(search).pipe(
          finalize(() => this.locationSearching = false)
        );
      })
    ).subscribe(results => {
      this.locationResults = results as Location[];
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editItem']) {
      if (this.editItem) {
        this.mode = this.editItem.kind;
        if (this.mode === 'category') {
          this.categoryForm.patchValue(this.editItem.data);
        } else {
          const task = this.editItem.data as any;
          const categoryIds = this.getTaskCategoryIds(task);
          this.taskForm.patchValue({
            name: task.name,
            categoryIds,
            description: task.description,
            priceLead: task.price?.lead || '',
            priceCall: task.price?.call || '',
            priceAppointment: task.price?.appointment || ''
          });
          const primaryCategoryId = categoryIds[0];
          if (primaryCategoryId) {
            this.loadStoredLocationPricing(primaryCategoryId);
          } else {
            this.resetLocationState();
          }
        }
      } else {
        this.mode = 'category';
        this.categoryForm.reset();
        this.taskForm.reset();
        this.resetLocationState();
      }
    }
  }

  setMode(mode: AddMode): void {
    this.mode = mode;
    this.errorMessage = '';
  }

  // ─── Location Search Methods ──────────────────────────

  onLocationSearch(value: string): void {
    this.locationSearchText = value;
    this.searchSubject.next(value);
  }

  selectLocation(loc: Location): void {
    this.selectedLocation = loc;
    this.locationResults = [];   // dropdown band karo
    this.locationSearchText = `${loc.city}, ${loc.state}`;
    this.loadZipcodes(loc);
  }

  loadZipcodes(loc: Location): void {
    const stateCode = loc.stateShort?.trim();

    this.zipcodesLoading = true;
    this.zipcodes = [];
    this.bulkApplyMessage = '';
    this.lastBulkSnapshot = [];

    if (!stateCode) {
      this.zipcodesLoading = false;
      this.errorMessage = 'Selected location is missing a state code.';
      return;
    }

    this.api.getZipcode(loc.city, stateCode).pipe(
      finalize(() => this.zipcodesLoading = false)
    ).subscribe({
      next: (results: ZipcodeResult[]) => {
        this.errorMessage = '';
        this.zipcodes = results.map((z: ZipcodeResult) => ({
          zipcode: z.zip,
          isChecked: false,
          prices: { leads: 0, warm_transfers: 0, inbounds: 0 }
        }));
      },
      error: () => {
        this.zipcodes = [];
      }
    });
  }

  updateZipPrice(index: number, field: 'leads' | 'warm_transfers' | 'inbounds', value: string): void {
    this.zipcodes[index].prices[field] = Number(value) || 0;
  }

  toggleZipCheck(index: number): void {
    this.zipcodes[index].isChecked = !this.zipcodes[index].isChecked;
  }

  applyBulkPrices(): void {
    if (!this.zipcodes.length) return;

    const hasCheckedRows = this.zipcodes.some(zip => zip.isChecked);
    let updatedCount = 0;
    const snapshot: BulkSnapshotItem[] = [];

    this.zipcodes.forEach((zip, index) => {
      if (hasCheckedRows && !zip.isChecked) return;

      snapshot.push({
        index,
        prices: {
          leads: zip.prices.leads,
          warm_transfers: zip.prices.warm_transfers,
          inbounds: zip.prices.inbounds
        }
      });

      zip.prices.leads = Number(this.bulkLeads) || 0;
      zip.prices.warm_transfers = Number(this.bulkWarmTransfers) || 0;
      zip.prices.inbounds = Number(this.bulkInbounds) || 0;
      updatedCount += 1;
    });

    this.lastBulkSnapshot = snapshot;
    this.bulkApplyMessage = `Applied to ${updatedCount} zipcodes`;

    if (this.bulkMessageTimer) {
      clearTimeout(this.bulkMessageTimer);
    }

    this.bulkMessageTimer = setTimeout(() => {
      this.bulkApplyMessage = '';
      this.bulkMessageTimer = null;
    }, 2200);
  }

  undoBulkPrices(): void {
    if (!this.lastBulkSnapshot.length) return;

    this.lastBulkSnapshot.forEach(({ index, prices }) => {
      const row = this.zipcodes[index];
      if (!row) return;
      row.prices.leads = prices.leads;
      row.prices.warm_transfers = prices.warm_transfers;
        row.prices.inbounds = prices.inbounds;
      });

    const restoredCount = this.lastBulkSnapshot.length;
    this.lastBulkSnapshot = [];
    this.bulkApplyMessage = `↩️ Restored ${restoredCount} zipcodes`;

    if (this.bulkMessageTimer) {
      clearTimeout(this.bulkMessageTimer);
    }

    this.bulkMessageTimer = setTimeout(() => {
      this.bulkApplyMessage = '';
      this.bulkMessageTimer = null;
    }, 2200);
  }

  canUndoBulkPrices(): boolean {
    return this.lastBulkSnapshot.length > 0;
  }

  private loadStoredLocationPricing(categoryId: string): void {
    this.zipcodesLoading = true;
    this.errorMessage = '';
    this.bulkApplyMessage = '';
    this.lastBulkSnapshot = [];

    this.api.getLocationPricing(categoryId).pipe(
      finalize(() => this.zipcodesLoading = false)
    ).subscribe({
      next: (savedLocations: SavedTaskLocation[]) => {
        const latestLocation = savedLocations?.[0];

        if (!latestLocation) {
          this.resetLocationState();
          this.showLocationPanel = true;
          return;
        }

        this.selectedLocation = {
          _id: '',
          location: latestLocation.location || '',
          city: latestLocation.city || '',
          state: latestLocation.state || '',
          stateShort: latestLocation.state || '',
          type: latestLocation.type || 'city'
        };

        this.locationSearchText = [this.selectedLocation.city, this.selectedLocation.state]
          .filter(Boolean)
          .join(', ');
        this.zipcodes = (latestLocation.service_area_zipcodes || []).map((zip) => ({
          zipcode: zip.zipcode,
          isChecked: !!zip.isChecked,
          prices: {
            leads: Number(zip.prices?.leads) || 0,
            warm_transfers: Number(zip.prices?.warm_transfers) || 0,
            inbounds: Number(zip.prices?.inbounds) || 0
          }
        }));
        this.showLocationPanel = true;
      },
      error: () => {
        this.resetLocationState();
        this.showLocationPanel = true;
      }
    });
  }

  resetLocationState(): void {
    this.locationSearchText = '';
    this.locationResults = [];
    this.selectedLocation = null;
    this.zipcodes = [];
    this.bulkLeads = 0;
    this.bulkWarmTransfers = 0;
    this.bulkInbounds = 0;
    this.bulkApplyMessage = '';
    this.lastBulkSnapshot = [];
    if (this.bulkMessageTimer) {
      clearTimeout(this.bulkMessageTimer);
      this.bulkMessageTimer = null;
    }
    this.showLocationPanel = false;
  }

saveLocationPricing(): void {
  if (!this.selectedLocation) return;

  const categoryIds = this.taskForm.getRawValue().categoryIds;
  if (!categoryIds?.length) {
    this.errorMessage = 'Please select a category first.';
    return;
  }

  const loc = this.selectedLocation;

  const payload = {
    category_id: categoryIds[0],
    location: `${loc.city}, ${loc.state}, ${loc.type}`, 
    city: loc.city,
    state: loc.state,
    country: null,
    type: loc.type?.toLowerCase() || 'city', 
    prices: { leads: 0, warm_transfers: 0, inbounds: 0 },
    service_area_zipcodes: this.zipcodes
  };

  this.api.saveLocationPricing(payload).subscribe({
    next: () => {
      this.errorMessage = '';
      alert('Location pricing saved!');
      this.resetLocationState();
    },
    error: () => {
      this.errorMessage = 'Failed to save location pricing.';
    }
  });
}

  // ─── Category / Task Save ─────────────────────────────

  relatedTasksForEditingCategory(): Task[] {
    if (this.editItem?.kind !== 'category') return [];
    const categoryId = this.editItem.data?._id;
    if (!categoryId) return [];
    return this.tasks.filter(task => this.getTaskCategoryIds(task).includes(categoryId));
  }

  priceForTask(task: Task, key: 'lead' | 'call' | 'appointment'): string {
    const value = task.price?.[key]?.trim();
    if (!value) return '--';
    return value.startsWith('$') ? value : `$${value}`;
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.errorMessage = '';
    const payload = this.categoryForm.getRawValue();
    const request$ = this.editItem?.kind === 'category'
      ? this.api.updateCategory(this.editItem.data._id, payload)
      : this.api.createCategory(payload);

    request$.pipe(finalize(() => this.saving = false)).subscribe({
      next: () => { this.categoryForm.reset(); this.saved.emit(); },
      error: (error: unknown) => { this.errorMessage = this.extractError(error, 'Unable to save category.'); }
    });
  }

  saveTask(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }
    const value = this.taskForm.getRawValue();
    const normalizedCategoryIds = (value.categoryIds || []).filter(Boolean);
    this.saving = true;
    this.errorMessage = '';

    const payload = {
      name: value.name,
      categoryId: normalizedCategoryIds[0],
      categoryIds: normalizedCategoryIds,
      description: value.description,
      price: {
        lead: value.priceLead,
        call: value.priceCall,
        appointment: value.priceAppointment
      }
    };

    const request$ = this.editItem?.kind === 'task'
      ? this.api.updateTask(this.editItem.data._id, payload)
      : this.api.createTask(payload);

    request$.pipe(finalize(() => this.saving = false)).subscribe({
      next: () => { this.taskForm.reset(); this.saved.emit(); },
      error: (error: unknown) => { this.errorMessage = this.extractError(error, 'Unable to save task.'); }
    });
  }

  private extractError(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const httpError = error as { error?: { message?: string } };
      return httpError.error?.message || fallback;
    }
    return fallback;
  }

  private getTaskCategoryIds(task: Task): string[] {
    const fromArray = Array.isArray(task.categoryIds)
      ? task.categoryIds.map(c => typeof c === 'string' ? c : c._id).filter(Boolean)
      : [];
    const fromSingle = typeof task.categoryId === 'string' ? task.categoryId : task.categoryId?._id;
    return [...new Set([...fromArray, fromSingle].filter(Boolean))];
  }
}
