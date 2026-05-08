import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-auth-redirect',
  templateUrl: './auth-redirect.html',
  styleUrl: './auth-redirect.css'
})
export class AuthRedirectComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.auth.loadCurrentUser().subscribe(user => {
      this.router.navigate([user?.role === 'admin' ? '/admin' : user ? '/user' : '/login']);
    });
  }
}
