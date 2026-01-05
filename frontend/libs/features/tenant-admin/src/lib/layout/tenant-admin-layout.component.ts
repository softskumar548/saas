import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '@features/auth';

@Component({
    selector: 'lib-tenant-admin-layout',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="flex h-screen bg-gray-50">
      <!-- Sidebar -->
      <aside class="w-64 bg-white text-gray-800 flex flex-col shadow-xl z-20 border-r border-gray-200">
        <div class="p-6 border-b border-gray-200 flex items-center gap-3">
          <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow-lg shadow-indigo-200">TA</div>
          <span class="font-bold text-lg tracking-tight text-gray-900">Tenant Admin</span>
        </div>
        
        <nav class="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <a routerLink="/tenant/dashboard" routerLinkActive="bg-indigo-50 text-indigo-600 border-l-4 border-indigo-500" class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 rounded hover:bg-gray-50 hover:text-indigo-600 transition-all group">
            <span class="text-xl opacity-70 group-hover:opacity-100">🏠</span>
            Dashboard
          </a>
          <a routerLink="/tenant/locations" routerLinkActive="bg-indigo-50 text-indigo-600 border-l-4 border-indigo-500" class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 rounded hover:bg-gray-50 hover:text-indigo-600 transition-all group">
            <span class="text-xl opacity-70 group-hover:opacity-100">📍</span>
            Locations
          </a>
          <a routerLink="/tenant/forms" routerLinkActive="bg-indigo-50 text-indigo-600 border-l-4 border-indigo-500" class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 rounded hover:bg-gray-50 hover:text-indigo-600 transition-all group">
            <span class="text-xl opacity-70 group-hover:opacity-100">📝</span>
            Forms
          </a>
          <a routerLink="/tenant/settings" routerLinkActive="bg-indigo-50 text-indigo-600 border-l-4 border-indigo-500" class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 rounded hover:bg-gray-50 hover:text-indigo-600 transition-all group">
            <span class="text-xl opacity-70 group-hover:opacity-100">⚙️</span>
            Settings
          </a>
        </nav>

        <div class="p-4 border-t border-gray-200">
           <div class="flex items-center gap-3 mb-4 px-2" *ngIf="authService.user() as user">
              <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                {{ user.full_name?.[0] || 'U' }}
              </div>
              <div class="flex-1 min-w-0">
                 <p class="text-sm font-medium text-gray-900 truncate">{{ user.full_name }}</p>
                 <p class="text-xs text-gray-500 truncate">{{ user.email }}</p>
              </div>
           </div>
           <button (click)="logout()" class="w-full py-2 px-4 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 text-sm font-medium transition-colors">
             Sign out
           </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-auto relative">
         <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 z-10"></div>
         <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class TenantAdminLayoutComponent {
    public authService = inject(AuthService);

    logout() {
        this.authService.logout();
    }
}
