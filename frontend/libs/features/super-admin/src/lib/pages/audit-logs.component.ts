import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api, AuditLog, listAuditLogsApiV1AdminAuditLogsGet } from '@shared/api-client';

@Component({
    selector: 'lib-sa-audit',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="p-8">
      <div class="flex justify-between items-center mb-8">
        <div>
           <h1 class="text-3xl font-bold text-gray-900">Audit Logs</h1>
           <p class="text-gray-500 mt-1">Track system activity and user actions.</p>
        </div>
        <button (click)="loadLogs()" class="p-2 text-gray-500 hover:text-purple-600 transition-colors" title="Refresh">
            🔄
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex gap-4">
          <div class="flex-1">
              <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Action</label>
              <input [(ngModel)]="filterAction" (keyup.enter)="loadLogs()" placeholder="e.g. create_tenant" class="w-full text-sm border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500">
          </div>
          <div class="flex-1">
              <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Target Type</label>
               <select [(ngModel)]="filterTarget" (change)="loadLogs()" class="w-full text-sm border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 bg-white">
                  <option value="">All Targets</option>
                  <option value="user">User</option>
                  <option value="tenant">Tenant</option>
                  <option value="plan">Plan</option>
                  <option value="feature">Feature Flag</option>
              </select>
          </div>
           <div class="flex items-end">
              <button (click)="loadLogs()" class="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium">Filter</button>
          </div>
      </div>

      <!-- Logs Table -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <div class="overflow-x-auto">
             <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    <tr *ngFor="let log of logs()" class="hover:bg-gray-50">
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {{ log.created_at | date:'medium' }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm font-medium text-gray-900">{{ log.user_email }}</div>
                            <div class="text-xs text-gray-500">ID: {{ log.user_id }}</div>
                        </td>
                         <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                {{ log.action }}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                             <span class="font-mono">{{ log.target_type }}</span>: {{ log.target_id }}
                        </td>
                         <td class="px-6 py-4 text-xs text-gray-500 font-mono max-w-xs truncate" [title]="JSON.stringify(log.details)">
                            {{ JSON.stringify(log.details) }}
                        </td>
                    </tr>
                    <tr *ngIf="!logs().length">
                        <td colspan="5" class="px-6 py-12 text-center text-gray-500">
                            No logs found matching criteria.
                        </td>
                    </tr>
                </tbody>
             </table>
         </div>
      </div>
    </div>
  `
})
export class AuditLogsComponent {
    private api = inject(Api);
    logs = signal<AuditLog[]>([]);

    // Filters
    filterAction = '';
    filterTarget = '';

    // Helper for template
    JSON = JSON;

    constructor() {
        this.loadLogs();
    }

    loadLogs() {
        this.api.invoke(listAuditLogsApiV1AdminAuditLogsGet, {
            action: this.filterAction || undefined,
            target_type: this.filterTarget || undefined,
            skip: 0,
            limit: 100
        }).then(res => {
            this.logs.set(res as AuditLog[]);
        });
    }
}
