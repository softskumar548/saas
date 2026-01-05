import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '@features/auth';

@Component({
  selector: 'lib-super-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="flex h-screen bg-gray-50">
      <!-- Sidebar -->
      <aside class="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-20">
        <div class="p-6 border-b border-slate-800 flex items-center gap-3">
          <div class="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center font-bold text-xs shadow-lg shadow-purple-900/50">SA</div>
          <span class="font-bold text-lg tracking-tight">Super Admin</span>
        </div>
        
        <nav class="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <a routerLink="/admin/overview" routerLinkActive="bg-slate-800 text-purple-400 border-l-4 border-purple-500" class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 rounded hover:bg-slate-800 hover:text-white transition-all group">
            <span class="text-xl opacity-70 group-hover:opacity-100">📊</span>
            Overview
          </a>
          <a routerLink="/admin/tenants" routerLinkActive="bg-slate-800 text-purple-400 border-l-4 border-purple-500" class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 rounded hover:bg-slate-800 hover:text-white transition-all group">
            <span class="text-xl opacity-70 group-hover:opacity-100">🏢</span>
            Tenants
          </a>
          <a routerLink="/admin/users" routerLinkActive="bg-slate-800 text-purple-400 border-l-4 border-purple-500" class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 rounded hover:bg-slate-800 hover:text-white transition-all group">
            <span class="text-xl opacity-70 group-hover:opacity-100">👥</span>
            Users
          </a>
          <a routerLink="/admin/plans" routerLinkActive="bg-slate-800 text-purple-400 border-l-4 border-purple-500" class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 rounded hover:bg-slate-800 hover:text-white transition-all group">
            <span class="text-xl opacity-70 group-hover:opacity-100">💳</span>
            Subscription Plans
          </a>
          <a routerLink="/admin/metrics" routerLinkActive="bg-slate-800 text-purple-400 border-l-4 border-purple-500" class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 rounded hover:bg-slate-800 hover:text-white transition-all group">
            <span class="text-xl opacity-70 group-hover:opacity-100">📈</span>
            Usage & Metrics
          </a>
           <a routerLink="/admin/health" routerLinkActive="bg-slate-800 text-purple-400 border-l-4 border-purple-500" class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 rounded hover:bg-slate-800 hover:text-white transition-all group">
            <span class="text-xl opacity-70 group-hover:opacity-100">🩺</span>
            System Health
          </a>
          <a routerLink="/admin/feature-flags" routerLinkActive="bg-slate-800 text-purple-400 border-l-4 border-purple-500" class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 rounded hover:bg-slate-800 hover:text-white transition-all group">
            <span class="text-xl opacity-70 group-hover:opacity-100">🚩</span>
            Feature Flags
          </a>
          <a routerLink="/admin/audit" routerLinkActive="bg-slate-800 text-purple-400 border-l-4 border-purple-500" class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 rounded hover:bg-slate-800 hover:text-white transition-all group">
            <span class="text-xl opacity-70 group-hover:opacity-100">📜</span>
            Audit Logs
          </a>
          <a routerLink="/admin/settings" routerLinkActive="bg-slate-800 text-purple-400 border-l-4 border-purple-500" class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-300 rounded hover:bg-slate-800 hover:text-white transition-all group">
            <span class="text-xl opacity-70 group-hover:opacity-100">⚙️</span>
            Settings
          </a>
        </nav>

        <div class="p-4 border-t border-slate-800">
           <div class="flex items-center gap-3 mb-4 px-2" *ngIf="authService.user() as user">
              <div class="w-8 h-8 rounded-full bg-purple-900 text-purple-200 flex items-center justify-center font-bold text-xs ring-2 ring-purple-600">
                {{ user.full_name?.[0] || 'A' }}
              </div>
              <div class="flex-1 min-w-0">
                 <p class="text-sm font-medium text-white truncate">{{ user.full_name }}</p>
                 <p class="text-xs text-slate-400 truncate">{{ user.email }}</p>
              </div>
           </div>
           <button (click)="logout()" class="w-full py-2 px-4 rounded border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white text-sm font-medium transition-colors">
             Sign out
           </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-auto relative">
         <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-600 to-blue-600 z-10"></div>
         <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class SuperAdminLayoutComponent {
  public authService = inject(AuthService);

  logout() {
    this.authService.logout();
  }
}
