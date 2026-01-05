import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api, getAdminStatsApiV1AdminOverviewGet } from '@shared/api-client';

@Component({
    selector: 'lib-sa-overview',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="p-8 space-y-8">
      <!-- Header -->
      <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold text-gray-900">Overview</h1>
          <div class="text-sm text-gray-500">Last updated: Just now</div>
      </div>
      
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Total Tenants -->
          <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div class="text-sm font-medium text-gray-500 mb-2">Total Tenants</div>
              <div class="flex items-baseline gap-2">
                  <span class="text-3xl font-bold text-gray-900">{{ stats()?.tenants?.total || 0 }}</span>
                  <span class="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+12%</span>
              </div>
          </div>
          <!-- Active Tenants -->
          <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div class="text-sm font-medium text-gray-500 mb-2">Active Tenants</div>
              <div class="flex items-baseline gap-2">
                  <span class="text-3xl font-bold text-gray-900">{{ stats()?.tenants?.active || 0 }}</span>
                  <span class="text-xs text-gray-500">Currently active</span>
              </div>
          </div>
          <!-- Paid Tenants -->
          <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div class="text-sm font-medium text-gray-500 mb-2">Paid Tenants</div>
              <div class="flex items-baseline gap-2">
                  <span class="text-3xl font-bold text-gray-900">{{ stats()?.subscriptions?.[0]?.count || 0 }}</span>
                  <span class="text-xs font-medium text-blue-600">Pro Plan</span>
              </div>
          </div>
      </div>

      <!-- Metric Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Feedback Today -->
          <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div class="text-sm font-medium text-gray-500 mb-2">Feedback Today</div>
              <div class="flex items-baseline gap-2">
                  <span class="text-3xl font-bold text-gray-900">{{ stats()?.feedback?.today || 0 }}</span>
                  <span class="text-xs text-gray-500">submissions</span>
              </div>
          </div>
          <!-- Submissions Month -->
          <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div class="text-sm font-medium text-gray-500 mb-2">Submissions (Month)</div>
              <div class="flex items-baseline gap-2">
                  <span class="text-3xl font-bold text-gray-900">{{ stats()?.feedback?.total || 0 }}</span>
                  <span class="text-xs text-green-600">On track</span>
              </div>
          </div>
          <!-- Error Rate -->
          <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div class="text-sm font-medium text-gray-500 mb-2">Error Rate (24h)</div>
              <div class="flex items-baseline gap-2">
                  <span class="text-3xl font-bold text-gray-900">0.05%</span>
                  <span class="text-xs text-green-600">Stable</span>
              </div>
          </div>
      </div>

      <!-- Charts & Alerts Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Line Chart Section -->
          <div class="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div class="flex items-center justify-between mb-6">
                  <h3 class="font-bold text-gray-900">Tenant Growth</h3>
                  <select class="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                      <option>Last 30 Days</option>
                      <option>Last 90 Days</option>
                  </select>
              </div>
              <div class="h-64 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200 text-gray-400">
                  [ Line Chart Visualization Placeholder ]
              </div>
          </div>

          <!-- Alerts Panel -->
          <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 class="font-bold text-gray-900 mb-4">System Alerts</h3>
              <div class="space-y-4">
                  <!-- Alert Item -->
                  <div class="flex gap-3">
                      <div class="mt-0.5 w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></div>
                      <div>
                          <p class="text-sm font-medium text-gray-900">Tenant exceeded response limit</p>
                          <p class="text-xs text-gray-500">City Hospital (Free Tier)</p>
                      </div>
                  </div>
                   <!-- Alert Item -->
                   <div class="flex gap-3">
                      <div class="mt-0.5 w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0"></div>
                      <div>
                          <p class="text-sm font-medium text-gray-900">Public endpoint rate-limit</p>
                          <p class="text-xs text-gray-500">Triggered 15 times in last hour</p>
                      </div>
                  </div>
                   <!-- Alert Item -->
                   <div class="flex gap-3">
                      <div class="mt-0.5 w-2 h-2 rounded-full bg-gray-400 flex-shrink-0"></div>
                      <div>
                          <p class="text-sm font-medium text-gray-900">Failed webhook retries</p>
                          <p class="text-xs text-gray-500">2 events dropped</p>
                      </div>
                  </div>
              </div>
              <button class="w-full mt-6 text-sm text-indigo-600 font-medium hover:text-indigo-800">
                  View All Alerts
              </button>
          </div>
      </div>
    </div>
    `,
})
export class OverviewComponent {
    private api = inject(Api);
    stats = signal<any>(null);

    constructor() {
        this.loadStats();
    }

    loadStats() {
        this.api.invoke(getAdminStatsApiV1AdminOverviewGet, {}).then(res => {
            this.stats.set(res);
        });
    }
}
