import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api, SystemHealth, getSystemHealthApiV1AdminMetricsHealthGet } from '@shared/api-client';

@Component({
    selector: 'lib-sa-health',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="p-8">
      <div class="flex justify-between items-center mb-8">
        <div>
           <h1 class="text-3xl font-bold text-gray-900">System Health</h1>
           <p class="text-gray-500 mt-1">Operational status and system logs.</p>
        </div>
        <button (click)="loadHealth()" class="p-2 text-gray-500 hover:text-purple-600 transition-colors" title="Refresh">
            🔄
        </button>
      </div>

      <!-- Status Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
         
         <!-- DB Status -->
         <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
            <div>
                <h3 class="text-sm font-medium text-gray-500 mb-1">Database</h3>
                <span class="text-lg font-bold" [class.text-green-600]="health()?.db_connected" [class.text-red-600]="!health()?.db_connected">
                    {{ health()?.db_connected ? 'Connected' : 'Disconnected' }}
                </span>
            </div>
            <div class="w-10 h-10 rounded-full flex items-center justify-center text-xl" 
                 [class.bg-green-100]="health()?.db_connected" [class.text-green-600]="health()?.db_connected"
                 [class.bg-red-100]="!health()?.db_connected" [class.text-red-600]="!health()?.db_connected">
                 🗄️
            </div>
         </div>

         <!-- API Uptime -->
         <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
            <div>
                <h3 class="text-sm font-medium text-gray-500 mb-1">API Uptime</h3>
                <span class="text-lg font-bold text-gray-900">{{ formatUptime(health()?.api_uptime_seconds || 0) }}</span>
            </div>
            <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl">
                 ⏱️
            </div>
         </div>

         <!-- Active Workers -->
         <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
            <div>
                <h3 class="text-sm font-medium text-gray-500 mb-1">Active Workers</h3>
                <span class="text-lg font-bold text-gray-900">{{ health()?.active_workers || 0 }}</span>
            </div>
            <div class="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xl">
                 ⚙️
            </div>
         </div>

         <!-- Error Rate -->
         <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
            <div>
                <h3 class="text-sm font-medium text-gray-500 mb-1">Error Rate (24h)</h3>
                <span class="text-lg font-bold" [class.text-green-600]="(health()?.error_rate_24h || 0) < 0.05" [class.text-red-600]="(health()?.error_rate_24h || 0) >= 0.05">
                    {{ (health()?.error_rate_24h || 0) | percent:'1.2-2' }}
                </span>
            </div>
            <div class="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xl">
                 ⚠️
            </div>
         </div>
      </div>

      <!-- System Logs -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
             <h3 class="font-bold text-gray-900">Recent System Logs</h3>
         </div>
         <div class="overflow-x-auto">
             <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    <tr *ngFor="let log of health()?.recent_logs" class="hover:bg-gray-50">
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {{ log.timestamp | date:'medium' }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full border" 
                                  [ngClass]="{
                                    'bg-green-100 text-green-800 border-green-200': log.level === 'INFO',
                                    'bg-yellow-100 text-yellow-800 border-yellow-200': log.level === 'WARNING',
                                    'bg-red-100 text-red-800 border-red-200': log.level === 'ERROR'
                                  }">
                                {{ log.level }}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                            {{ log.source }}
                        </td>
                         <td class="px-6 py-4 text-sm text-gray-900">
                            {{ log.message }}
                        </td>
                    </tr>
                </tbody>
             </table>
         </div>
      </div>
    </div>
  `
})
export class SystemHealthComponent {
    private api = inject(Api);
    health = signal<SystemHealth | null>(null);

    constructor() {
        this.loadHealth();
    }

    loadHealth() {
        this.api.invoke(getSystemHealthApiV1AdminMetricsHealthGet).then(res => {
            this.health.set(res);
        });
    }

    formatUptime(seconds: number): string {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        parts.push(`${minutes}m`);

        return parts.join(' ');
    }
}
