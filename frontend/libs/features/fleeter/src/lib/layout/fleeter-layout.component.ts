import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '@features/auth';

@Component({
  selector: 'lib-fleeter-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-100 flex">
      <!-- Sidebar -->
      <aside class="w-64 bg-indigo-900 text-white flex-shrink-0 hidden md:flex flex-col">
        <div class="p-6 border-b border-indigo-800 flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-white">S</div>
          <span class="text-xl font-bold tracking-tight">Sales<span class="text-indigo-400">Desk</span></span>
        </div>
        
        <nav class="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <a routerLink="/fleeter/overview" routerLinkActive="bg-indigo-800 text-white" class="group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-indigo-100 hover:bg-indigo-800 hover:text-white transition-colors">
            <span class="mr-3 text-lg opacity-80">📊</span>
            Overview
          </a>
          
          <div class="pt-4 pb-2 px-3 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            Sales Pipeline
          </div>
          
          <a routerLink="/fleeter/leads" routerLinkActive="bg-indigo-800 text-white" class="group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-indigo-100 hover:bg-indigo-800 hover:text-white transition-colors">
            <span class="mr-3 text-lg opacity-80">🎯</span>
            Leads
          </a>
          <a routerLink="/fleeter/follow-ups" routerLinkActive="bg-indigo-800 text-white" class="group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-indigo-100 hover:bg-indigo-800 hover:text-white transition-colors">
            <span class="mr-3 text-lg opacity-80">📞</span>
            Tasks & Follow-ups
          </a>
          <a routerLink="/fleeter/onboarding" routerLinkActive="bg-indigo-800 text-white" class="group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-indigo-100 hover:bg-indigo-800 hover:text-white transition-colors">
            <span class="mr-3 text-lg opacity-80">🚀</span>
            Onboarding
          </a>

          <div class="pt-4 pb-2 px-3 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            Management
          </div>

          <a routerLink="/fleeter/tenants" routerLinkActive="bg-indigo-800 text-white" class="group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-indigo-100 hover:bg-indigo-800 hover:text-white transition-colors">
            <span class="mr-3 text-lg opacity-80">🏢</span>
            Tenants
          </a>
          <a routerLink="/fleeter/performance" routerLinkActive="bg-indigo-800 text-white" class="group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-indigo-100 hover:bg-indigo-800 hover:text-white transition-colors">
            <span class="mr-3 text-lg opacity-80">📈</span>
            Performance
          </a>
        </nav>

        <div class="p-4 border-t border-indigo-800">
           <div class="flex items-center gap-3 px-3 py-2">
             <a routerLink="/fleeter/profile" class="flex items-center gap-3 flex-1 min-w-0 group cursor-pointer">
                <div class="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold group-hover:bg-indigo-400 transition-colors">
                    {{ authService.user()?.full_name?.charAt(0) || 'U' }}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-white truncate group-hover:text-indigo-200 transition-colors">{{ authService.user()?.full_name || 'User' }}</p>
                    <p class="text-xs text-indigo-300 truncate font-medium">View Profile</p>
                </div>
             </a>
             <button (click)="logout()" class="p-1.5 text-indigo-300 hover:text-white hover:bg-indigo-800 rounded-md transition-colors" title="Log out">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
             </button>
           </div>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <!-- Mobile Header -->
        <header class="bg-white shadow-sm md:hidden flex items-center justify-between p-4 z-10">
           <span class="font-bold text-gray-900">SalesDesk</span>
           <button class="text-gray-500 hover:text-gray-700">
             ☰
           </button>
        </header>

        <main class="flex-1 overflow-y-auto focus:outline-none">
           <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class FleeterLayoutComponent {
  authService = inject(AuthService);

  logout() {
    this.authService.logout();
  }
}
