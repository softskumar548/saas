import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TenantAdminService, Form, FormStats } from '../tenant-admin.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'lib-form-analytics',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    template: `
    <div class="max-w-6xl mx-auto py-8 px-4" *ngIf="form && stats; else loading">
      <div class="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <div class="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                <a routerLink="/tenant/forms" class="hover:text-gray-700">Forms</a>
                <span>/</span>
                <span>Analytics</span>
            </div>
            <h1 class="text-3xl font-bold text-gray-900">{{ form.title }}</h1>
        </div>
        <div class="flex flex-wrap gap-2 items-end">
            <div>
                <label class="block text-xs font-bold text-gray-500">Start Date</label>
                <input type="date" [(ngModel)]="filters.start_date" class="border rounded p-1 text-sm">
            </div>
            <div>
                <label class="block text-xs font-bold text-gray-500">End Date</label>
                <input type="date" [(ngModel)]="filters.end_date" class="border rounded p-1 text-sm">
            </div>
             <div>
                <label class="block text-xs font-bold text-gray-500">Location ID</label>
                <input type="number" [(ngModel)]="filters.location_id" placeholder="All" class="border rounded p-1 text-sm w-20">
            </div>
            <button (click)="refresh()" class="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700">Filter</button>
            <button (click)="exportCsv()" class="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center">
                <span class="mr-1">⬇</span> CSV
            </button>
        </div>
      </div>

      <!-- Overview Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white overflow-hidden shadow rounded-lg">
             <div class="px-4 py-5 sm:p-6">
                <dt class="text-sm font-medium text-gray-500 truncate">Total Responses</dt>
                <dd class="mt-1 text-3xl font-semibold text-gray-900">{{ stats.total_responses }}</dd>
             </div>
          </div>
          
          <!-- Dynamic Rating Summaries -->
          <ng-container *ngFor="let item of stats.field_summaries | keyvalue">
              <div class="bg-white overflow-hidden shadow rounded-lg" *ngIf="item.value.type === 'rating'">
                 <div class="px-4 py-5 sm:p-6">
                    <dt class="text-sm font-medium text-gray-500 truncate">{{ item.value.label }}</dt>
                    <dd class="mt-1 text-3xl font-semibold text-gray-900 flex items-baseline">
                        {{ item.value.average }} <span class="text-sm text-gray-400 ml-1 font-normal">/ 5</span>
                    </dd>
                    <div class="text-xs text-gray-400 mt-1">{{ item.value.count }} ratings</div>
                 </div>
              </div>
          </ng-container>
      </div>

      <!-- Recent Responses -->
      <div class="bg-white shadow overflow-hidden sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6">
           <h3 class="text-lg leading-6 font-medium text-gray-900">Recent Feedback</h3>
           <p class="mt-1 max-w-2xl text-sm text-gray-500">Latest submissions filtered by selection.</p>
        </div>
        <div class="border-t border-gray-200">
            <ul class="divide-y divide-gray-200">
                <li *ngFor="let response of stats.recent_responses" class="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div class="flex items-center justify-between">
                        <div class="text-sm font-medium text-indigo-600 truncate">
                            ID: {{ response.id }} <span *ngIf="response.location_id" class="text-gray-400 font-normal ml-2">(Loc: {{response.location_id}})</span>
                        </div>
                        <div class="ml-2 flex-shrink-0 flex">
                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                {{ response.created_at | date:'short' }}
                            </span>
                        </div>
                    </div>
                    <div class="mt-2 text-sm text-gray-700 space-y-1">
                        <div *ngFor="let item of response.data | keyvalue">
                            <span class="font-bold">{{ item.key }}:</span> {{ item.value }}
                        </div>
                    </div>
                </li>
                 <li *ngIf="stats.recent_responses.length === 0" class="px-4 py-8 text-center text-gray-500">
                    No responses found for these filters.
                 </li>
            </ul>
        </div>
      </div>
    </div>
    <ng-template #loading>
        <div class="p-8 text-center text-gray-500">Loading analytics...</div>
    </ng-template>
  `
})
export class FormAnalyticsComponent implements OnInit {
    private service = inject(TenantAdminService);
    private route = inject(ActivatedRoute);

    form: Form | null = null;
    stats: FormStats | null = null;

    filters = {
        start_date: '',
        end_date: '',
        location_id: null
    };

    ngOnInit() {
        const idStr = this.route.snapshot.paramMap.get('id');
        if (idStr) {
            const id = parseInt(idStr, 10);
            this.loadData(id);
        }
    }

    loadData(id: number) {
        // Parallel load
        this.service.getForm(id).subscribe(f => this.form = f);
        this.service.getFormStats(id, this.cleanFilters()).subscribe(s => this.stats = s);
    }

    refresh() {
        if (this.form) {
            this.service.getFormStats(this.form.id, this.cleanFilters()).subscribe(s => this.stats = s);
        }
    }

    exportCsv() {
        if (this.form) {
            this.service.exportFormCsv(this.form.id, this.cleanFilters()).subscribe(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `export_${this.form?.slug}_${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
            });
        }
    }

    cleanFilters() {
        const f: any = {};
        if (this.filters.start_date) f.start_date = new Date(this.filters.start_date).toISOString();
        if (this.filters.end_date) f.end_date = new Date(this.filters.end_date).toISOString();
        if (this.filters.location_id) f.location_id = this.filters.location_id;
        return f;
    }
}
