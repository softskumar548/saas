import { Component, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '@features/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-100 p-8">
      <div class="max-w-7xl mx-auto">
        <h1 class="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
        
        <ng-container *ngIf="authService.user() as user">
            
            <!-- Fleeter (Sales) View -->
            <div *ngIf="user.role === 'fleeter'" class="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <h2 class="text-2xl font-bold text-blue-900 mb-4">Sales Dashboard</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="p-6 bg-white rounded-lg shadow">
                        <h3 class="text-xl font-bold text-gray-900 mb-2">Onboard New Tenant</h3>
                        <p class="text-gray-600 mb-4">Register a new business tenant on-site.</p>
                        <button class="text-blue-600 font-bold hover:underline" disabled>Launch Wizard</button>
                    </div>
                </div>
            </div>

            <!-- Tenant View (Admin & Staff) -->
            <div *ngIf="['tenant_admin', 'tenant_staff'].includes(user.role)" class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Locations Card -->
                <a routerLink="/tenant/locations" class="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                    <h2 class="text-xl font-bold text-gray-900 mb-2">Locations</h2>
                    <p class="text-gray-600">Manage your physical locations and generate QR codes.</p>
                </a>

                <!-- Forms Card -->
                <a routerLink="/tenant/forms" class="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                    <h2 class="text-xl font-bold text-gray-900 mb-2">Forms</h2>
                    <p class="text-gray-600">Create feedback forms and view analytics.</p>
                </a>

                <!-- Settings Card (Admin Only) -->
                <a *ngIf="user.role === 'tenant_admin'" routerLink="/tenant/settings" class="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                    <h2 class="text-xl font-bold text-gray-900 mb-2">Settings</h2>
                    <p class="text-gray-600">Configure tenant branding and general settings.</p>
                </a>
            </div>

        </ng-container>

        <div class="mt-8 text-center">
             <button (click)="logout()" class="text-indigo-600 hover:text-indigo-500 font-medium">Log out</button>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent {
  public authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    effect(() => {
      const user = this.authService.user();
      if (user?.role === 'super_admin') {
        this.router.navigate(['/admin']);
      } else if (user?.role === 'fleeter') {
        this.router.navigate(['/fleeter']);
      }
    });
  }

  logout() {
    this.authService.logout();
  }
}
