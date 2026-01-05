import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api, UsageMetrics, getUsageMetricsApiV1AdminMetricsGet } from '@shared/api-client';

@Component({
    selector: 'lib-sa-metrics',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="p-8">
      <div class="flex justify-between items-center mb-8">
        <div>
           <h1 class="text-3xl font-bold text-gray-900">Platform Usage & Metrics</h1>
           <p class="text-gray-500 mt-1">Real-time visibility into system load and growth.</p>
        </div>
        <button (click)="loadMetrics()" class="p-2 text-gray-500 hover:text-purple-600 transition-colors" title="Refresh">
            🔄
        </button>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
         <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 class="text-sm font-medium text-gray-500 mb-2">Requests / Minute</h3>
            <div class="flex items-baseline">
                <span class="text-3xl font-extrabold text-gray-900">{{ metrics()?.requests_per_minute || 0 }}</span>
                <span class="ml-2 text-sm text-green-600 font-medium">↑ 12%</span>
            </div>
         </div>
          <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 class="text-sm font-medium text-gray-500 mb-2">Rate Limit Triggers</h3>
            <div class="flex items-baseline">
                <span class="text-3xl font-extrabold text-gray-900">{{ metrics()?.rate_limit_triggers || 0 }}</span>
                <span class="ml-2 text-sm text-gray-500 font-medium">Last 24h</span>
            </div>
         </div>
          <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 class="text-sm font-medium text-gray-500 mb-2">Total Feedback (30d)</h3>
            <div class="flex items-baseline">
                <span class="text-3xl font-extrabold text-gray-900">{{ totalFeedback() }}</span>
            </div>
         </div>
         <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 class="text-sm font-medium text-gray-500 mb-2">Active Tenants (30d)</h3>
             <div class="flex items-baseline">
                <span class="text-3xl font-extrabold text-gray-900">{{ metrics()?.top_tenants?.length || 0 }}</span>
            </div>
         </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Daily Submissions Chart -->
          <div class="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
             <h3 class="text-lg font-bold text-gray-900 mb-6">Feedback Submissions (Last 30 Days)</h3>
             
             <!-- CSS Bar Chart -->
             <div class="h-64 flex items-end gap-2 overflow-x-auto pb-4">
                <div *ngFor="let day of metrics()?.daily_submissions" class="flex flex-col items-center flex-1 min-w-[20px] group">
                    <div class="w-full bg-purple-100 rounded-t relative hover:bg-purple-200 transition-colors" 
                         [style.height.%]="(day.count / maxDailyCount()) * 100">
                         <!-- Tooltip -->
                         <div class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                            {{ day.date }}: {{ day.count }}
                         </div>
                    </div>
                    <!-- Axis Label (Every 5th day) -->
<!--                    <span *ngIf="$index % 5 === 0" class="text-[10px] text-gray-400 mt-2 -rotate-45 origin-top-left">{{ day.date | date:'MM/dd' }}</span>-->
                </div>
             </div>
             
             <!-- X-Axis Labels (Simplified) -->
            <div class="flex justify-between text-xs text-gray-400 mt-2 px-2 border-t border-gray-100 pt-2">
                <span>30 Days Ago</span>
                <span>Today</span>
            </div>
          </div>

          <!-- Top Tenants List -->
           <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
             <h3 class="text-lg font-bold text-gray-900 mb-6">Top Tenants by Volume</h3>
             <div class="space-y-4">
                <div *ngFor="let tenant of metrics()?.top_tenants; let i = index" class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-bold flex items-center justify-center text-xs border border-gray-200">
                            {{ i + 1 }}
                        </div>
                        <span class="font-medium text-gray-900 truncate max-w-[120px]" [title]="tenant.tenant_name">{{ tenant.tenant_name }}</span>
                    </div>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {{ tenant.count }}
                    </span>
                </div>
                <div *ngIf="!metrics()?.top_tenants?.length" class="text-center text-gray-500 py-8">
                    No data available.
                </div>
             </div>
           </div>
      </div>
    </div>
  `
})
export class UsageMetricsComponent {
    private api = inject(Api);
    metrics = signal<UsageMetrics | null>(null);

    constructor() {
        this.loadMetrics();
    }

    loadMetrics() {
        this.api.invoke(getUsageMetricsApiV1AdminMetricsGet, {}).then(res => {
            this.metrics.set(res as UsageMetrics);
        });
    }

    // Computed Helpers
    maxDailyCount() {
        const data = this.metrics()?.daily_submissions || [];
        if (!data.length) return 1;
        return Math.max(...data.map(d => d.count)) || 1; // Avoid divide by zero
    }

    totalFeedback() {
        return this.metrics()?.daily_submissions.reduce((acc, curr) => acc + curr.count, 0) || 0;
    }
}
