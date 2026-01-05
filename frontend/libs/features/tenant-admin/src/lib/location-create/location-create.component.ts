import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TenantAdminService } from '../tenant-admin.service';
import { Router } from '@angular/router';

@Component({
  selector: 'lib-location-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="max-w-2xl mx-auto py-8">
      <h2 class="text-2xl font-bold mb-6">Add New Location</h2>
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Location Name</label>
          <input formControlName="name" type="text" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Display Slug (Unique ID)</label>
          <input formControlName="slug" type="text" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border">
          <p class="text-xs text-gray-500">Used in URLs: /f/slug?loc=YOUR_SLUG</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Address (Optional)</label>
          <input formControlName="address" type="text" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border">
        </div>
        
        <div class="flex justify-end gap-4">
            <button type="button" (click)="cancel()" class="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" [disabled]="form.invalid" class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50">Save Location</button>
        </div>
      </form>
    </div>
  `
})
export class LocationCreateComponent {
  private fb = inject(FormBuilder);
  private service = inject(TenantAdminService);
  private router = inject(Router);

  form = this.fb.group({
    name: ['', Validators.required],
    slug: ['', Validators.required], // TODO: Add validation for slugs
    address: ['']
  });

  onSubmit() {
    if (this.form.valid) {
      this.service.createLocation(this.form.value as any).subscribe({
        next: () => {
          this.router.navigate(['/tenant/locations']);
        },
        error: (err) => alert('Failed to create location: ' + err.message)
      });
    }
  }

  cancel() {
    this.router.navigate(['/tenant/locations']);
  }
}
