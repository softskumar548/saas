import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TenantAdminService, Location, Form } from '../tenant-admin.service';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'lib-location-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="max-w-6xl mx-auto py-8 px-4">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-900">Locations</h1>
        <a routerLink="/tenant/locations/new" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Add Location</a>
      </div>

      <div class="bg-white shadow overflow-hidden sm:rounded-md">
        <ul *ngIf="locations$ | async as locations; else loading" class="divide-y divide-gray-200">
          <li *ngFor="let loc of locations" class="p-4 hover:bg-gray-50 flex justify-between items-center">
             <div class="flex-1">
                <p class="text-lg font-medium text-gray-900">{{ loc.name }}</p>
                <p class="text-sm text-gray-500">Slug: {{ loc.slug }}</p>
             </div>
             
             <!-- Public URL Column -->
             <div class="flex-1 px-4 text-sm text-gray-600 truncate">
                 <ng-container *ngIf="loc.default_form_id; else fallbackCheck">
                    <span class="text-xs text-indigo-600 font-bold uppercase tracking-wider block">Mapped</span>
                    <a [href]="getPublicUrl(loc)" target="_blank" class="text-blue-600 hover:underline">
                        {{ getPublicUrl(loc) }}
                    </a>
                 </ng-container>
                 <ng-template #fallbackCheck>
                     <ng-container *ngIf="defaultFormId; else unmapped">
                        <span class="text-xs text-gray-500 font-bold uppercase tracking-wider block">Default</span>
                        <a [href]="getDefaultUrl(loc)" target="_blank" class="text-gray-500 hover:text-blue-600 hover:underline">
                            {{ getDefaultUrl(loc) }}
                        </a>
                     </ng-container>
                 </ng-template>
                 <ng-template #unmapped>
                     <span class="text-gray-400 italic">Unmapped</span>
                 </ng-template>
             </div>

             <div>
                <!-- QR Code Action -->
                <button (click)="viewQr(loc)" class="text-indigo-600 hover:text-indigo-900 font-medium">View QR</button>
             </div>
          </li>
          <li *ngIf="locations.length === 0" class="p-8 text-center text-gray-500">
            No locations found. Create one to get started.
          </li>
        </ul>
        <ng-template #loading>
            <div class="p-8 text-center text-gray-500">Loading locations...</div>
        </ng-template>
      </div>
      
      <!-- QR Modal -->
      <div *ngIf="selectedLocation" class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
         <div class="bg-white rounded-lg p-6 max-w-sm w-full text-center shadow-xl">
            <h3 class="text-xl font-bold mb-4 text-gray-800">QR Code for {{ selectedLocation.name }}</h3>
            
            <div class="mb-6 text-left">
                <label class="block text-sm font-medium text-gray-700 mb-1">Mapped Form</label>
                <select [(ngModel)]="selectedFormId" (change)="onFormChange()" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border">
                    <option [ngValue]="null" disabled>Select a form to map...</option>
                    <option *ngFor="let form of availableForms" [value]="form.id">{{ form.title }} <span *ngIf="form.is_default">(Default)</span></option>
                </select>
                <p class="text-xs text-gray-500 mt-1" *ngIf="!selectedFormId">
                    Select a form to activate this location and generate a QR code.
                </p>
                <p class="text-xs text-green-600 mt-1" *ngIf="selectedFormId && selectedFormId === defaultFormId && !selectedLocation.default_form_id">
                    Using Tenant Default Form.
                </p>
            </div>

            <div class="mb-4 flex justify-center items-center h-48 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <img [src]="qrImageSrc" *ngIf="qrImageSrc" class="max-h-full max-w-full"/>
                <div *ngIf="!qrImageSrc" class="text-gray-400 text-sm p-4">
                    {{ qrUrl === 'Generating...' ? 'Generating...' : 'No Form Selected' }}
                </div>
            </div>
            
            <p class="text-xs text-gray-500 break-all mb-6 px-2 bg-gray-50 py-1 rounded select-all" *ngIf="qrUrl && qrUrl !== 'Generating...'">
                {{ qrUrl }}
            </p>

            <div class="flex justify-end">
                <button (click)="closeQr()" class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-medium transition-colors">Close</button>
            </div>
         </div>
      </div>
    </div>
  `
})
export class LocationListComponent {
  private service = inject(TenantAdminService);
  locations$ = this.service.getLocations();

  selectedLocation: Location | null = null;
  selectedFormId: number | null = null;
  availableForms: Form[] = [];
  qrImageSrc: string | null = null;
  qrUrl: string | null = null;

  formsMap = new Map<number, string>(); // ID -> Slug
  defaultFormId: number | null = null;
  defaultFormSlug: string | null = null;

  constructor() {
    // Pre-fetch forms for lookup and Default identification
    this.service.getForms().subscribe(forms => {
      this.availableForms = forms.filter(f => f.is_published);
      forms.forEach(f => {
        this.formsMap.set(f.id, f.slug);
        if (f.is_default) {
          this.defaultFormId = f.id;
          this.defaultFormSlug = f.slug;
        }
      });
    });
  }

  getPublicUrl(loc: Location): string {
    if (!loc.default_form_id) return '';
    const slug = this.formsMap.get(loc.default_form_id);
    if (!slug) return 'Loading...';
    return `${window.location.origin}/f/${slug}?loc=${loc.id}`;
  }

  getDefaultUrl(loc: Location): string {
    if (!this.defaultFormSlug) return '';
    return `${window.location.origin}/f/${this.defaultFormSlug}?loc=${loc.id}`;
  }

  viewQr(loc: Location) {
    this.selectedLocation = loc;
    this.qrImageSrc = null;
    this.qrUrl = null;

    // Logic: Use mapped form OR Default form
    this.selectedFormId = loc.default_form_id || this.defaultFormId || null;

    if (this.selectedFormId) {
      this.generateQr();
    } else {
      // Unmapped AND No Default state
    }
  }

  onFormChange() {
    if (this.selectedLocation && this.selectedFormId) {
      // Persist the mapping
      this.service.updateLocation(this.selectedLocation.id, { default_form_id: this.selectedFormId })
        .subscribe({
          next: (updatedLoc) => {
            // Update local list to reflect change immediately
            this.locations$ = this.service.getLocations(); // Refresh list
            this.selectedLocation = updatedLoc; // Update reference
            this.generateQr();
          },
          error: (err) => alert("Failed to save mapping.")
        });
    }
  }

  generateQr() {
    if (!this.selectedLocation || !this.selectedFormId) return;

    const form = this.availableForms.find(f => f.id == this.selectedFormId);
    if (!form) return;

    this.qrUrl = 'Generating...';
    this.qrImageSrc = null;

    this.service.getQrCodeImage(this.selectedLocation.id, form.slug).subscribe({
      next: (blob) => {
        this.qrImageSrc = URL.createObjectURL(blob);
        this.qrUrl = `${window.location.origin}/f/${form.slug}?loc=${this.selectedLocation!.id}`;
      },
      error: () => {
        this.qrUrl = 'Failed to generate';
      }
    });
  }

  closeQr() {
    this.selectedLocation = null;
    if (this.qrImageSrc) URL.revokeObjectURL(this.qrImageSrc);
    this.qrImageSrc = null;
  }
}
