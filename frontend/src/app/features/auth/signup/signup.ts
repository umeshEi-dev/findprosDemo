import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-signup',
  imports: [CommonModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css'
})
export class SignupComponent {
  private readonly router = inject(Router);

  startOnboarding(): void {
    this.router.navigate(['/signup/step1']);
  }
}
