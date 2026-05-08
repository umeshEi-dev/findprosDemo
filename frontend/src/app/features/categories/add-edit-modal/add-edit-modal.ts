import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, OnChanges, SimpleChanges } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, finalize, map, of, Subject, switchMap, timeout } from 'rxjs';
import { Category } from '../../../core/models/category.model';
import { Location, LocationPricingPayload, ZipcodePricing, ZipcodeResult } from '../../../core/models/location.model';
import { Task } from '../../../core/models/task.model';
import { CategoryApiService } from '../../../core/services/category-api.service';

type AddMode = 'category' | 'task';
type ZipPriceField = 'leads' | 'warm_transfers' | 'inbounds';
type PriceMap = Record<ZipPriceField, number>;
type BulkSnapshotItem = {
  locationKey: string;
  locationPrices: PriceMap;
  zipcodes: { index: number; prices: PriceMap }[];
};

interface SavedTaskLocation {
  _id?: string;
  location?: string;
  city?: string;
  state?: string;
  country?: string | null;
  type?: string;
  prices?: Partial<PriceMap>;
  isChecked?: boolean;
  service_area_zipcodes?: ZipcodePricing[];
}

interface SelectedLocationPricing {
  key: string;
  persistedId?: string;
  location: Location;
  isChecked: boolean;
  accordionOpen: boolean;
  zipcodes: ZipcodePricing[];
  zipcodesLoading: boolean;
  prices: PriceMap;
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

  locationSearchText = '';
  locationResults: Location[] = [];
  locationSearching = false;
  selectedLocations: SelectedLocationPricing[] = [];

  bulkLeads = 0;
  bulkWarmTransfers = 0;
  bulkInbounds = 0;
  bulkApplyMessage = '';
  private bulkMessageTimer: ReturnType<typeof setTimeout> | null = null;
  private lastBulkSnapshot: BulkSnapshotItem[] = [];

  showLocationPanel = false;

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
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(search => {
        if (!search.trim()) {
          this.locationResults = [];
          this.locationSearching = false;
          return of([]);
        }

        this.locationSearching = true;
        return this.api.getLocation(search).pipe(
          catchError(() => {
            this.errorMessage = 'Unable to search locations.';
            return of([]);
          }),
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

  onLocationSearch(value: string): void {
    this.locationSearchText = value;
    this.searchSubject.next(value);
  }

  includeLocation(loc: Location): void {
    const location = this.normalizeLocation(loc);
    const key = this.locationKey(location);
    const existingLocation = this.selectedLocations.find(selected => selected.key === key);

    if (existingLocation) {
      existingLocation.accordionOpen = true;
      this.locationResults = [];
      return;
    }

    const selectedLocation = this.createSelectedLocation(location, {
      isChecked: true,
      accordionOpen: true,
      prices: this.currentBulkPrices()
    });

    this.selectedLocations = [selectedLocation, ...this.selectedLocations];
    this.locationResults = [];
    this.loadZipcodes(selectedLocation);
  }

  removeLocation(locationKey: string): void {
    this.selectedLocations = this.selectedLocations.filter(location => location.key !== locationKey);
    this.lastBulkSnapshot = this.lastBulkSnapshot.filter(item => item.locationKey !== locationKey);
  }

  toggleLocationCheck(location: SelectedLocationPricing): void {
    location.isChecked = !location.isChecked;
  }

  toggleZipCheck(location: SelectedLocationPricing, index: number): void {
    const zipcode = location.zipcodes[index];
    if (!zipcode) return;
    zipcode.isChecked = !zipcode.isChecked;
  }

  updateLocationPrice(location: SelectedLocationPricing, field: ZipPriceField, value: string): void {
    location.prices[field] = Number(value) || 0;
  }

  updateZipPrice(location: SelectedLocationPricing, index: number, field: ZipPriceField, value: string): void {
    const zipcode = location.zipcodes[index];
    if (!zipcode) return;
    zipcode.prices[field] = Number(value) || 0;
  }

  applyBulkPrices(): void {
    if (!this.selectedLocations.length) return;

    const hasCheckedRows = this.selectedLocations.some(location => location.isChecked);
    const targetLocations = this.selectedLocations.filter(location => !hasCheckedRows || location.isChecked);

    const prices = this.currentBulkPrices();
    const snapshot: BulkSnapshotItem[] = targetLocations.map(location => ({
      locationKey: location.key,
      locationPrices: { ...location.prices },
      zipcodes: location.zipcodes.map((zip, index) => ({
        index,
        prices: { ...zip.prices }
      }))
    }));

    targetLocations.forEach(location => {
      location.prices = { ...prices };
      location.zipcodes.forEach(zip => {
        zip.prices = { ...prices };
      });
    });

    this.lastBulkSnapshot = snapshot;
    this.setBulkMessage(`Applied to ${targetLocations.length} location${targetLocations.length === 1 ? '' : 's'}`);
  }

  undoBulkPrices(): void {
    if (!this.lastBulkSnapshot.length) return;

    this.lastBulkSnapshot.forEach(snapshot => {
      const location = this.selectedLocations.find(selected => selected.key === snapshot.locationKey);
      if (!location) return;

      location.prices = { ...snapshot.locationPrices };
      snapshot.zipcodes.forEach(({ index, prices }) => {
        const row = location.zipcodes[index];
        if (!row) return;
        row.prices = { ...prices };
      });
    });

    const restoredCount = this.lastBulkSnapshot.length;
    this.lastBulkSnapshot = [];
    this.setBulkMessage(`Restored ${restoredCount} location${restoredCount === 1 ? '' : 's'}`);
  }

  canUndoBulkPrices(): boolean {
    return this.lastBulkSnapshot.length > 0;
  }

  isLocationIncluded(loc: Location): boolean {
    return this.selectedLocations.some(selected => selected.key === this.locationKey(this.normalizeLocation(loc)));
  }

  formatLocation(location: Location): string {
    return [location.city, location.state, location.type].filter(Boolean).join(', ');
  }

  trackLocation(_index: number, location: SelectedLocationPricing): string {
    return location.key;
  }

  resetLocationState(): void {
    this.locationSearchText = '';
    this.locationResults = [];
    this.locationSearching = false;
    this.selectedLocations = [];
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
    if (!this.selectedLocations.length) return;

    const categoryIds = this.taskForm.getRawValue().categoryIds;
    if (!categoryIds?.length) {
      this.errorMessage = 'Please select a category first.';
      return;
    }

    const payload = {
      category_id: categoryIds[0],
      locations: this.selectedLocations.map(location => this.toLocationPricingPayload(categoryIds[0], location))
    };

    this.api.saveLocationPricing(payload).subscribe({
      next: () => {
        this.errorMessage = '';
        alert('Location pricing saved!');
        this.resetLocationState();
        this.showLocationPanel = true;
      },
      error: () => {
        this.errorMessage = 'Failed to save location pricing.';
      }
    });
  }

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

  private loadZipcodes(location: SelectedLocationPricing): void {
    const stateCode = location.location.stateShort?.trim();
    const city = location.location.city?.trim();

    location.zipcodesLoading = true;
    location.zipcodes = [];

    if (!city) {
      location.zipcodesLoading = false;
      this.errorMessage = 'Selected location is missing a city.';
      return;
    }

    if (!stateCode) {
      location.zipcodesLoading = false;
      this.errorMessage = 'Selected location is missing a state code.';
      return;
    }

    this.errorMessage = '';

    this.api.getZipcode(city, stateCode).pipe(
      timeout(15000),
      map((results: ZipcodeResult[]) => {
        if (!Array.isArray(results)) {
          throw new Error('Invalid zipcode response.');
        }

        return results.map((z: ZipcodeResult) => this.toZipcodePricing(z, location.prices));
      }),
      catchError(() => {
        this.errorMessage = `Unable to load zipcodes for ${this.formatLocation(location.location)}.`;
        return of([]);
      }),
      finalize(() => location.zipcodesLoading = false)
    ).subscribe({
      next: (zipcodes: ZipcodePricing[]) => {
        location.zipcodes = zipcodes;
        if (zipcodes.length) {
          this.errorMessage = '';
        }
      }
    });
  }

  private loadStoredLocationPricing(categoryId: string): void {
    this.errorMessage = '';
    this.bulkApplyMessage = '';
    this.lastBulkSnapshot = [];
    this.selectedLocations = [];

    this.api.getLocationPricing(categoryId).subscribe({
      next: (savedLocations: SavedTaskLocation[]) => {
        if (!savedLocations?.length) {
          this.resetLocationState();
          this.showLocationPanel = true;
          return;
        }

        this.selectedLocations = savedLocations.map((savedLocation, index) => {
          const prices = this.toPrices(savedLocation.prices);
          const location = this.normalizeLocation({
            _id: savedLocation._id || '',
            location: savedLocation.location || '',
            city: savedLocation.city || '',
            state: savedLocation.state || '',
            stateShort: savedLocation.state || '',
            type: savedLocation.type || 'City'
          });

          return this.createSelectedLocation(location, {
            persistedId: savedLocation._id,
            isChecked: !!savedLocation.isChecked,
            accordionOpen: index === 0,
            prices,
            zipcodes: (savedLocation.service_area_zipcodes || []).map(zip => this.toStoredZipcodePricing(zip, prices))
          });
        });

        this.showLocationPanel = true;
      },
      error: () => {
        this.resetLocationState();
        this.showLocationPanel = true;
      }
    });
  }

  private createSelectedLocation(
    location: Location,
    options: Partial<Omit<SelectedLocationPricing, 'key' | 'location'>> = {}
  ): SelectedLocationPricing {
    return {
      key: this.locationKey(location),
      location,
      persistedId: options.persistedId,
      isChecked: options.isChecked ?? false,
      accordionOpen: options.accordionOpen ?? false,
      zipcodes: options.zipcodes || [],
      zipcodesLoading: options.zipcodesLoading ?? false,
      prices: options.prices || this.emptyPrices()
    };
  }

  private toLocationPricingPayload(categoryId: string, selectedLocation: SelectedLocationPricing): LocationPricingPayload {
    const loc = selectedLocation.location;

    return {
      category_id: categoryId,
      location: this.formatLocation(loc),
      city: loc.city,
      state: loc.stateShort || loc.state,
      country: null,
      type: loc.type?.toLowerCase() || 'city',
      isChecked: selectedLocation.isChecked,
      prices: selectedLocation.prices,
      service_area_zipcodes: selectedLocation.zipcodes
    };
  }

  private currentBulkPrices(): PriceMap {
    return {
      leads: Number(this.bulkLeads) || 0,
      warm_transfers: Number(this.bulkWarmTransfers) || 0,
      inbounds: Number(this.bulkInbounds) || 0
    };
  }

  private emptyPrices(): PriceMap {
    return { leads: 0, warm_transfers: 0, inbounds: 0 };
  }

  private toPrices(prices?: Partial<PriceMap>): PriceMap {
    return {
      leads: Number(prices?.leads) || 0,
      warm_transfers: Number(prices?.warm_transfers) || 0,
      inbounds: Number(prices?.inbounds) || 0
    };
  }

  private toStoredZipcodePricing(zip: ZipcodePricing, fallbackPrices: PriceMap): ZipcodePricing {
    return {
      zipcode: zip.zipcode,
      isChecked: !!zip.isChecked,
      prices: this.toPrices(zip.prices || fallbackPrices)
    };
  }

  private setBulkMessage(message: string): void {
    this.bulkApplyMessage = message;

    if (this.bulkMessageTimer) {
      clearTimeout(this.bulkMessageTimer);
    }

    this.bulkMessageTimer = setTimeout(() => {
      this.bulkApplyMessage = '';
      this.bulkMessageTimer = null;
    }, 2200);
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

  private normalizeLocation(loc: Location): Location {
    const state = loc.state?.trim() || '';
    const stateShort = loc.stateShort?.trim() || (state.length === 2 ? state : '');

    return {
      ...loc,
      city: loc.city?.trim() || '',
      state,
      stateShort,
      type: loc.type || 'City'
    };
  }

  private locationKey(loc: Location): string {
    return [
      loc.city?.trim().toLowerCase(),
      (loc.stateShort || loc.state)?.trim().toLowerCase(),
      loc.type?.trim().toLowerCase()
    ].filter(Boolean).join('|');
  }

  private toZipcodePricing(zipcode: ZipcodeResult, prices: PriceMap): ZipcodePricing {
    return {
      zipcode: zipcode.zip,
      isChecked: false,
      prices: { ...prices }
    };
  }
}
