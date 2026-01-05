import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-fleeter-overview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <!-- Header & Goals -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight">Sales Dashboard</h1>
          <p class="text-gray-500 mt-1 font-medium">Welcome back! Here's your sales progress snapshot.</p>
        </div>
        <div class="flex gap-3">
          <div class="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
            <div class="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-200">🎯</div>
            <div>
              <div class="text-xs font-bold text-indigo-400 uppercase tracking-wider">Month Goal</div>
              <div class="text-lg font-bold text-indigo-900">12 / 20 Tenants</div>
              <div class="w-32 h-1.5 bg-indigo-200 rounded-full mt-1 overflow-hidden">
                <div class="h-full bg-indigo-600 rounded-full" style="width: 60%"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Key Metrics KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
             <div class="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">👤</div>
             <div class="text-sm font-medium text-gray-400">Leads Assigned</div>
             <div class="text-2xl font-bold text-gray-900 mt-1">124</div>
             <div class="text-xs text-green-500 font-bold mt-1">↑ 12% vs last week</div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
             <div class="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">🏢</div>
             <div class="text-sm font-medium text-gray-400">Tenants (Month)</div>
             <div class="text-2xl font-bold text-gray-900 mt-1">12</div>
             <div class="text-xs text-green-500 font-bold mt-1">↑ 2 new today</div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
             <div class="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">⚡</div>
             <div class="text-sm font-medium text-gray-400">Active Tenants</div>
             <div class="text-2xl font-bold text-gray-900 mt-1">86</div>
             <div class="text-xs text-gray-400 font-medium mt-1">Across all regions</div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
             <div class="w-10 h-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">⏳</div>
             <div class="text-sm font-medium text-gray-400">Pending Actions</div>
             <div class="text-2xl font-bold text-gray-900 mt-1">18</div>
             <div class="text-xs text-orange-500 font-bold mt-1">4 High priority</div>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
             <div class="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">💎</div>
             <div class="text-sm font-medium text-gray-400">Conversion Rate</div>
             <div class="text-2xl font-bold text-gray-900 mt-1">9.6%</div>
             <div class="text-xs text-red-500 font-bold mt-1">↓ 0.4% from avg</div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Funnel Chart Visual -->
        <div class="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 class="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span class="w-1 h-6 bg-indigo-600 rounded-full"></span>
            Sales Funnel Progress
          </h3>
          <div class="space-y-6 py-4">
             <!-- Funnel Bar: Leads -->
             <div class="relative">
                <div class="flex justify-between items-end mb-1">
                   <span class="text-sm font-bold text-gray-600">Leads Generated</span>
                   <span class="text-sm font-black text-indigo-600">1,240</span>
                </div>
                <div class="h-10 w-full bg-gray-50 rounded-xl overflow-hidden shadow-inner flex border border-gray-100">
                   <div class="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 w-full animate-grow-x"></div>
                </div>
             </div>
             <!-- Funnel Bar: Signups -->
             <div class="relative pl-8">
                <div class="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                <div class="flex justify-between items-end mb-1">
                   <span class="text-sm font-bold text-gray-600">Free Signups</span>
                   <span class="text-sm font-black text-indigo-500">420</span>
                </div>
                <div class="h-10 w-full bg-gray-50 rounded-xl overflow-hidden shadow-inner flex border border-gray-100">
                   <div class="h-full bg-gradient-to-r from-indigo-400 to-indigo-500 w-[33%]"></div>
                </div>
             </div>
             <!-- Funnel Bar: Active Tenants -->
             <div class="relative pl-16">
                <div class="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                <div class="flex justify-between items-end mb-1">
                   <span class="text-sm font-bold text-gray-600">Onboarded & Active</span>
                   <span class="text-sm font-black text-indigo-400">86</span>
                </div>
                <div class="h-10 w-full bg-gray-50 rounded-xl overflow-hidden shadow-inner flex border border-gray-100">
                   <div class="h-full bg-gradient-to-r from-indigo-300 to-indigo-400 w-[12%]"></div>
                </div>
             </div>
          </div>
          <div class="mt-8 pt-6 border-t border-gray-50 text-sm text-gray-400 italic">
            * Data reflects sales performance over the current rolling 30-day period.
          </div>
        </div>

        <!-- Alerts and Stalled Onboarding -->
        <div class="space-y-6">
          <div class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-full">
            <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center justify-between">
              Critical Alerts
              <span class="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full uppercase font-black">Urgent</span>
            </h3>
            <div class="space-y-4 flex-1">
              <div class="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex gap-3">
                <div class="text-xl">⚠️</div>
                <div>
                   <div class="text-sm font-bold text-orange-900">Follow-up Overdue</div>
                   <div class="text-xs text-orange-700">Aster Prime Hospital (slug: aster) is waiting for response since 3 days.</div>
                </div>
              </div>
              <div class="p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3">
                <div class="text-xl">🛑</div>
                <div>
                   <div class="text-sm font-bold text-red-900">Stalled Onboarding</div>
                   <div class="text-xs text-red-700">Acme Corp hasn't verified their email in 48 hours.</div>
                </div>
              </div>
            </div>
            <button class="mt-6 w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200">
              View All Alerts
            </button>
          </div>
        </div>
      </div>
      
      <!-- Quick Actions -->
      <div class="bg-gradient-to-r from-gray-900 to-indigo-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl">
         <div class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
               <h2 class="text-2xl font-black mb-2 leading-tight">Ready to expand the network?</h2>
               <p class="text-indigo-200">Start a new tenant onboarding process in less than 2 minutes.</p>
            </div>
            <button class="bg-white text-indigo-900 px-8 py-4 rounded-2xl font-black hover:bg-indigo-50 transition-all flex items-center gap-2 group shadow-xl shadow-indigo-950/20">
               Onboard New Tenant
               <span class="group-hover:translate-x-1 transition-transform">→</span>
            </button>
         </div>
         <div class="absolute right-[-5%] top-[-50%] w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
         <div class="absolute left-[10%] bottom-[-50%] w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes grow-x {
      from { width: 0; }
      to { width: var(--final-width); }
    }
    .animate-grow-x {
      animation: grow-x 1s ease-out forwards;
    }
  `]
})
export class FleeterOverviewComponent { }

