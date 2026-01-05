import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TenantAdminService } from '../tenant-admin.service';
import { environment } from '../../../../../../apps/web-client/src/environments/environment';

type BrandingState = 'dashboard' | 'success';

@Component({
  selector: 'lib-tenant-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="max-w-2xl mx-auto py-12 px-4">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Brand Settings</h1>
      <p class="text-gray-600 mb-6">Customize your company branding.</p>
      
      <form [formGroup]="form" (ngSubmit)="onApprove()" class="space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">
              Company Name <span class="text-red-500">*</span>
            </label>
            <input formControlName="name" 
                   [class.border-red-500]="form.get('name')?.invalid && form.get('name')?.touched"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" 
                   placeholder="Acme Inc.">
            <p *ngIf="form.get('name')?.invalid && form.get('name')?.touched" class="mt-1 text-xs text-red-500 font-medium">
              Company name is required.
            </p>
          </div>
          
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Tag Line</label>
            <input formControlName="tagline" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="Your tagline">
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Logo</label>
            <div class="flex items-center gap-4 mt-1">
              <img *ngIf="logoPreviewUrl || form.get('logo_url')?.value" 
                   [src]="logoPreviewUrl || getLogoUrl(form.get('logo_url')?.value)" 
                   class="h-12 w-12 object-contain border rounded p-1">
              <input type="file" (change)="onFileSelected($event)" accept=".png,.jpg,.jpeg,.svg" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100">
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Primary Color</label>
              <div class="flex items-center gap-2 p-2 border border-gray-300 rounded-lg bg-gray-50">
                <input type="color" formControlName="primary_color" class="w-8 h-8 border-none bg-transparent cursor-pointer">
                <span class="text-xs font-mono font-bold uppercase">{{ form.get('primary_color')?.value }}</span>
              </div>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Secondary Color</label>
              <div class="flex items-center gap-2 p-2 border border-gray-300 rounded-lg bg-gray-50">
                <input type="color" formControlName="secondary_color" class="w-8 h-8 border-none bg-transparent cursor-pointer">
                <span class="text-xs font-mono font-bold uppercase">{{ form.get('secondary_color')?.value }}</span>
              </div>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Accent Color</label>
              <div class="flex items-center gap-2 p-2 border border-gray-300 rounded-lg bg-gray-50">
                <input type="color" formControlName="accent_color" class="w-8 h-8 border-none bg-transparent cursor-pointer">
                <span class="text-xs font-mono font-bold uppercase">{{ form.get('accent_color')?.value }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-4 border-t border-gray-100">
          <button type="submit" [disabled]="saving || !form.valid" class="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all transform active:scale-95 disabled:opacity-50 disabled:shadow-none">
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </form>

      <div *ngIf="state === 'success'" class="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
        <div class="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <div>
          <h4 class="text-sm font-bold text-gray-900">Branding Updated!</h4>
          <p class="text-xs text-gray-500 italic">Your organization identity has been successfully saved.</p>
        </div>
      </div>
    </div>
  `
})
export class SettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(TenantAdminService);

  state: BrandingState = 'dashboard';
  analyzing = false;
  saving = false;
  tenant: any = null;
  selectedLogoFile: File | null = null;
  logoPreviewUrl: string | null = null;

  form = this.fb.group({
    name: ['', Validators.required],
    tagline: [''],
    logo_url: [''],
    logo_position: ['top-left'],
    primary_color: ['#4F46E5'],
    secondary_color: ['#374151'],
    accent_color: ['#F3F4F6'],
    font_family: ['Inter'],
    address: [''],
    is_branding_approved: [false]
  });

  ngOnInit() {
    this.loadTenant();
  }

  loadTenant() {
    this.service.getTenant().subscribe(tenant => {
      this.tenant = tenant;
      this.form.patchValue(tenant);
      this.form.markAsPristine();
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedLogoFile = file;
      if (this.logoPreviewUrl) {
        URL.revokeObjectURL(this.logoPreviewUrl);
      }
      this.logoPreviewUrl = URL.createObjectURL(file);
      this.form.markAsDirty();
    }
  }

  onApprove() {
    if (this.form.valid) {
      const password = prompt('Please enter your password to confirm branding changes:');
      if (!password) return;

      this.saving = true;

      const formData = new FormData();
      const val = this.form.value;

      formData.append('name', val.name || '');
      formData.append('tagline', val.tagline || '');
      formData.append('logo_position', val.logo_position || 'top-left');
      formData.append('primary_color', val.primary_color || '#4F46E5');
      formData.append('secondary_color', val.secondary_color || '');
      formData.append('accent_color', val.accent_color || '');
      formData.append('font_family', val.font_family || 'Inter');
      formData.append('address', val.address || '');
      formData.append('password', password);

      if (this.selectedLogoFile) {
        formData.append('logo_file', this.selectedLogoFile);
      }

      this.service.approveBranding(formData).subscribe({
        next: () => {
          this.saving = false;
          this.state = 'success';
          this.form.markAsPristine();
          this.selectedLogoFile = null;
          if (this.logoPreviewUrl) {
            URL.revokeObjectURL(this.logoPreviewUrl);
            this.logoPreviewUrl = null;
          }
          setTimeout(() => this.state = 'dashboard', 3000);
          this.loadTenant(); // Reload to get the new logo_url from backend
        },
        error: (err) => {
          this.saving = false;
          alert(err.error?.detail || 'Error saving branding');
        }
      });
    }
  }

  viewPublicForm() {
    if (this.tenant?.slug) {
      window.open(`/f/${this.tenant.slug}`, '_blank');
    }
  }

  getLogoUrl(url: string | null | undefined) {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) {
      return `${environment.apiUrl}${url}`;
    }
    return url;
  }
}
