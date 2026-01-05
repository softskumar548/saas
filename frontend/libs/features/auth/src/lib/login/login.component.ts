import { Component, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'lib-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div [class]="asModal ? 'fixed inset-0 z-[1000] flex items-center justify-center' : 'flex min-h-screen items-center justify-center bg-gray-100'">
      <!-- Backdrop for Modal -->
      <div *ngIf="asModal" class="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" (click)="onClose()"></div>

      <div class="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl relative z-10 transition-all transform animate-[scaleIn_0.2s_ease-out]">
        <!-- Close Button -->
        <button *ngIf="asModal" (click)="onClose()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div>
          <h2 class="mt-2 text-center text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
          <p *ngIf="asModal" class="mt-2 text-center text-sm text-gray-600">
            Welcome back! Please enter your details.
          </p>
        </div>
        <form class="mt-8 space-y-6" (ngSubmit)="onSubmit()">
          <!-- Fields (unchanged mostly, just styling tweaks for consistency) -->
          <div class="space-y-4">
            <div>
              <label for="email-address" class="block text-sm font-medium text-gray-700">Email address</label>
              <input id="email-address" name="email" type="email" autocomplete="email" required [(ngModel)]="email"
                class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-3 px-4 bg-gray-50"
                placeholder="you@company.com">
            </div>
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
              <input id="password" name="password" type="password" autocomplete="current-password" required [(ngModel)]="password"
                class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-3 px-4 bg-gray-50"
                placeholder="••••••••">
            </div>
          </div>

          <div *ngIf="errorMessage()" class="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center font-medium border border-red-100">
            {{ errorMessage() }}
          </div>

          <div>
            <button type="submit" [disabled]="isLoading()"
              class="group relative flex w-full justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 transition shadow-lg shadow-blue-600/30">
              <span *ngIf="isLoading()" class="flex items-center gap-2">
                <svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Signing in...
              </span>
              <span *ngIf="!isLoading()">Sign in</span>
            </button>
          </div>
        </form>
        <div class="text-center text-xs text-gray-500 mt-6">
          <p>Demo? Use <span class="font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-700">admin@saas.com</span> / <span class="font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-700">adminpassword</span></p>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  authService = inject(AuthService);
  router = inject(Router);

  @Input() asModal = false;
  @Output() close = new EventEmitter<void>();

  email = '';
  password = '';
  errorMessage = signal('');
  isLoading = signal(false);

  onClose() {
    this.close.emit();
  }

  async onSubmit() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      await this.authService.login({
        username: this.email,
        password: this.password,
        grant_type: 'password', // OAuth2 requirement
        client_id: '',
        client_secret: ''
      });
      // If modal, close it? Or navigate?
      // Usually after login we go to dashboard.
      // But if we are in a modal on landing page, maybe we want to go to dashboard too?
      // Yes.
      const user = this.authService.user();
      if (user?.role === 'super_admin') {
        this.router.navigate(['/admin']);
      } else if (user?.role === 'fleeter') {
        this.router.navigate(['/fleeter']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    } catch (err: any) {
      console.error(err);
      this.errorMessage.set('Invalid credentials or server error');
    } finally {
      this.isLoading.set(false);
    }
  }
}
