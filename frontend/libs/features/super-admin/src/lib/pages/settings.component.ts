import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Api, SystemSetting, listSettingsApiV1AdminSettingsGet, updateSettingApiV1AdminSettingsKeyPut } from '@shared/api-client';

@Component({
    selector: 'lib-sa-settings',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
    <div class="p-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">System Settings</h1>
      <p class="text-gray-500 mb-8">Manage platform configurations and defaults.</p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <!-- Branding -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 class="text-xl font-bold text-gray-900 mb-4">Branding & Identity</h2>
              <form [formGroup]="brandingForm" (ngSubmit)="saveSetting('branding', brandingForm.value)">
                  <div class="space-y-4">
                      <div>
                          <label class="block text-sm font-medium text-gray-700">Platform Name</label>
                          <input formControlName="platform_name" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 border">
                      </div>
                      <div>
                          <label class="block text-sm font-medium text-gray-700">Logo URL</label>
                          <input formControlName="logo_url" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 border">
                      </div>
                       <div>
                          <label class="block text-sm font-medium text-gray-700">Primary Color</label>
                          <div class="flex gap-2">
                            <input formControlName="primary_color" type="color" class="h-10 w-12 p-0 border border-gray-300 rounded overflow-hidden cursor-pointer">
                            <input formControlName="primary_color" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 border uppercase font-mono">
                          </div>
                      </div>
                  </div>
                  <div class="mt-6 flex justify-end">
                      <button type="submit" [disabled]="loading('branding')" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors">
                          {{ loading('branding') ? 'Saving...' : 'Save Branding' }}
                      </button>
                  </div>
              </form>
          </div>

          <!-- Support -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 class="text-xl font-bold text-gray-900 mb-4">Support Contact</h2>
              <form [formGroup]="supportForm" (ngSubmit)="saveSetting('support', supportForm.value)">
                  <div class="space-y-4">
                      <div>
                          <label class="block text-sm font-medium text-gray-700">Support Email</label>
                          <input formControlName="email" type="email" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 border">
                      </div>
                      <div>
                          <label class="block text-sm font-medium text-gray-700">Support Phone</label>
                          <input formControlName="phone" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 border">
                      </div>
                       <div>
                          <label class="block text-sm font-medium text-gray-700">Help Center URL</label>
                          <input formControlName="help_center_url" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 border">
                      </div>
                  </div>
                  <div class="mt-6 flex justify-end">
                      <button type="submit" [disabled]="loading('support')" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors">
                          {{ loading('support') ? 'Saving...' : 'Save Info' }}
                      </button>
                  </div>
              </form>
          </div>

          <!-- Limits -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:col-span-2">
              <h2 class="text-xl font-bold text-gray-900 mb-4">Default Limits</h2>
               <p class="text-sm text-gray-500 mb-4">These limits are applied to new features or plans where explicit limits aren't set.</p>
              <form [formGroup]="limitsForm" (ngSubmit)="saveSetting('limits', limitsForm.value)">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                          <label class="block text-sm font-medium text-gray-700">Max Forms (Default)</label>
                          <input formControlName="default_max_forms" type="number" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 border">
                      </div>
                      <div>
                          <label class="block text-sm font-medium text-gray-700">Max Responses (Default)</label>
                          <input formControlName="default_max_responses" type="number" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 border">
                      </div>
                  </div>
                  <div class="mt-6 flex justify-end">
                      <button type="submit" [disabled]="loading('limits')" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors">
                          {{ loading('limits') ? 'Saving...' : 'Save Defaults' }}
                      </button>
                  </div>
              </form>
          </div>
      </div>
    </div>
  `
})
export class SettingsComponent {
    private api = inject(Api);
    private fb = inject(FormBuilder);

    // Status tracking for buttons
    loadingStates = signal<Record<string, boolean>>({});

    brandingForm = this.fb.group({
        platform_name: [''],
        logo_url: [''],
        primary_color: ['#6d28d9']
    });

    supportForm = this.fb.group({
        email: ['', [Validators.email]],
        phone: [''],
        help_center_url: ['']
    });

    limitsForm = this.fb.group({
        default_max_forms: [3],
        default_max_responses: [100]
    });

    constructor() {
        this.loadSettings();
    }

    loading(key: string) {
        return this.loadingStates()[key] || false;
    }

    loadSettings() {
        this.api.invoke(listSettingsApiV1AdminSettingsGet).then(settings => {
            settings.forEach(s => {
                if (s.key === 'branding') this.brandingForm.patchValue(s.value as any);
                if (s.key === 'support') this.supportForm.patchValue(s.value as any);
                if (s.key === 'limits') this.limitsForm.patchValue(s.value as any);
            });
        });
    }

    saveSetting(key: string, value: any) {
        this.loadingStates.update(prev => ({ ...prev, [key]: true }));

        this.api.invoke(updateSettingApiV1AdminSettingsKeyPut, {
            key: key,
            body: { key: key, value: value }
        }).then(() => {
            this.loadingStates.update(prev => ({ ...prev, [key]: false }));
            // Could add toast here
        }).catch(() => {
            this.loadingStates.update(prev => ({ ...prev, [key]: false }));
        });
    }
}
