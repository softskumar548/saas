import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TenantAdminService, Form } from '../tenant-admin.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'lib-form-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="max-w-6xl mx-auto py-8 px-4">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-900">Forms</h1>
        <a routerLink="/tenant/forms/new" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Create Form</a>
      </div>

      <div class="bg-white shadow overflow-hidden sm:rounded-md">
        <ul *ngIf="forms$ | async as forms; else loading" class="divide-y divide-gray-200">
          <li *ngFor="let form of forms" class="p-4 hover:bg-gray-50 flex justify-between items-center">
            <div>
              <div class="flex items-center space-x-2">
                  <p class="text-lg font-medium text-gray-900">{{ form.title }}</p>
                  <span *ngIf="form.is_default" class="px-2 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-800 font-semibold border border-indigo-200">
                      Default
                  </span>
              </div>
              <div class="flex items-center space-x-2 text-sm text-gray-500">
                <span>/f/{{ form.slug }}</span>
                <span [class.text-green-600]="form.is_published" [class.text-gray-400]="!form.is_published" class="px-2 py-0.5 rounded-full text-xs bg-gray-100">
                  {{ form.is_published ? 'Published' : 'Draft' }}
                </span>
              </div>
            </div>
            <div class="flex space-x-4 items-center">
               <button *ngIf="!form.is_default" (click)="setDefault(form)" class="text-sm text-gray-500 hover:text-indigo-600 underline">Set Default</button>
               <a [routerLink]="['/tenant/forms', form.id]" class="text-indigo-600 hover:text-indigo-900">Edit</a>
               <a [routerLink]="['/tenant/forms', form.id, 'analytics']" class="text-indigo-600 hover:text-indigo-900">Analytics</a>
               <a href="/f/{{form.slug}}" target="_blank" class="text-gray-400 hover:text-gray-600">
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                 </svg>
               </a>
            </div>
          </li>
          <li *ngIf="forms.length === 0" class="p-8 text-center text-gray-500">
            No forms found. Create one to collect feedback.
          </li>
        </ul>
        <ng-template #loading>
            <div class="p-8 text-center text-gray-500">Loading forms...</div>
        </ng-template>
      </div>
    </div>
  `
})
export class FormListComponent {
  private service = inject(TenantAdminService);
  forms$ = this.service.getForms();

  setDefault(form: Form) {
    if (confirm(`Set "${form.title}" as the default form? This will be used for any location without an explicit mapping.`)) {
      this.service.setDefaultForm(form.id).subscribe(() => {
        this.forms$ = this.service.getForms(); // Refresh list to update badges
      });
    }
  }
}
