import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Api, FeatureFlag, listFeaturesApiV1AdminFeaturesGet, createFeatureApiV1AdminFeaturesPost, updateFeatureApiV1AdminFeaturesFeatureIdPut, toggleFeatureStatusApiV1AdminFeaturesFeatureIdTogglePost } from '@shared/api-client';

@Component({
    selector: 'lib-sa-features',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
    <div class="p-8">
      <div class="flex justify-between items-center mb-8">
        <div>
           <h1 class="text-3xl font-bold text-gray-900">Feature Flags</h1>
           <p class="text-gray-500 mt-1">Control feature availability and rollouts.</p>
        </div>
        <button (click)="openCreateModal()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium shadow-sm transition-colors">
            + New Feature
        </button>
      </div>

      <!-- Feature List -->
      <div class="space-y-4">
        <div *ngFor="let feature of features()" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
           
           <div class="flex-1">
              <div class="flex items-center gap-3 mb-1">
                 <h3 class="text-lg font-bold text-gray-900">{{ feature.name }}</h3>
                 <span *ngIf="feature.is_enabled" class="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded-full">ENABLED</span>
                 <span *ngIf="!feature.is_enabled" class="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">DISABLED</span>
              </div>
              <p class="text-gray-600 text-sm mb-4">{{ feature.description }}</p>
              
              <!-- Rollout & Filters Status -->
              <div class="flex gap-6 text-sm">
                  <div class="flex items-center gap-2">
                     <span class="text-gray-500">Rollout:</span>
                     <div class="w-32 bg-gray-200 rounded-full h-2.5">
                        <div class="bg-purple-600 h-2.5 rounded-full" [style.width.%]="feature.rollout_percentage"></div>
                     </div>
                     <span class="font-bold">{{ feature.rollout_percentage }}%</span>
                  </div>
                  <div class="flex items-center gap-2">
                     <span class="text-gray-500">Targeting:</span>
                     <span class="font-medium" *ngIf="hasFilters(feature)">Specific Tenants</span>
                     <span class="text-gray-400" *ngIf="!hasFilters(feature)">All</span>
                  </div>
              </div>
           </div>

           <!-- Actions -->
           <div class="flex items-center gap-3">
              <button (click)="openEditModal(feature)" class="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                  Configure
              </button>
               <button (click)="toggleFeature(feature)" class="w-12 h-6 rounded-full transition-colors relative"
                       [class.bg-green-500]="feature.is_enabled" [class.bg-gray-300]="!feature.is_enabled">
                   <div class="w-4 h-4 bg-white rounded-full absolute top-1 transition-transform"
                        [class.left-1]="!feature.is_enabled" [class.left-7]="feature.is_enabled"></div>
               </button>
           </div>
        </div>
      </div>

      <!-- Create/Edit Modal -->
      <div *ngIf="showModal()" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
         <div class="bg-white rounded-xl shadow-xl p-8 w-full max-w-lg animate-in fade-in zoom-in duration-200">
            <h2 class="text-2xl font-bold mb-6">{{ editingFeature() ? 'Configure Feature' : 'Create Feature' }}</h2>
            
            <form [formGroup]="featureForm" (ngSubmit)="saveFeature()">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Feature Key (Name)</label>
                        <input formControlName="name" [readonly]="!!editingFeature()" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 border" [class.bg-gray-100]="editingFeature()">
                        <p class="text-xs text-gray-500 mt-1">Unique key used in code (e.g. 'ai_summaries')</p>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Description</label>
                        <textarea formControlName="description" rows="2" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 border"></textarea>
                    </div>

                    <!-- Rollout -->
                    <div>
                         <label class="block text-sm font-medium text-gray-700 mb-2">Rollout Percentage</label>
                         <div class="flex items-center gap-4">
                            <input type="range" formControlName="rollout_percentage" min="0" max="100" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600">
                            <span class="font-bold w-12 text-right">{{ featureForm.get('rollout_percentage')?.value }}%</span>
                         </div>
                    </div>

                    <!-- Tenant Filters -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Target Tenant IDs</label>
                        <input formControlName="tenant_ids" placeholder="1, 5, 12 (Leave empty for all)" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 border">
                        <p class="text-xs text-gray-500 mt-1">Comma separated IDs of tenants to whitelist.</p>
                    </div>
                </div>

                <div class="mt-8 flex justify-end gap-3">
                    <button type="button" (click)="showModal.set(false)" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                    <button type="submit" [disabled]="featureForm.invalid || loading()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                        {{ loading() ? 'Saving...' : 'Save Feature' }}
                    </button>
                </div>
            </form>
         </div>
      </div>
    </div>
  `
})
export class FeatureFlagsComponent {
    private api = inject(Api);
    private fb = inject(FormBuilder);

    features = signal<FeatureFlag[]>([]);
    showModal = signal(false);
    editingFeature = signal<FeatureFlag | null>(null);
    loading = signal(false);

    featureForm = this.fb.group({
        name: ['', Validators.required],
        description: [''],
        rollout_percentage: [0],
        tenant_ids: ['']
    });

    constructor() {
        this.loadFeatures();
    }

    loadFeatures() {
        this.api.invoke(listFeaturesApiV1AdminFeaturesGet, { skip: 0, limit: 100 }).then(res => {
            this.features.set(res);
        });
    }

    hasFilters(feature: FeatureFlag): boolean {
        return (feature.filters as any)?.['tenant_ids']?.length > 0;
    }

    openCreateModal() {
        this.editingFeature.set(null);
        this.featureForm.reset({
            name: '',
            description: '',
            rollout_percentage: 0,
            tenant_ids: ''
        });
        this.showModal.set(true);
    }

    openEditModal(feature: FeatureFlag) {
        this.editingFeature.set(feature);
        this.featureForm.patchValue({
            name: feature.name,
            description: feature.description,
            rollout_percentage: feature.rollout_percentage,
            tenant_ids: (feature.filters as any)?.['tenant_ids']?.join(', ') || ''
        });
        this.showModal.set(true);
    }

    saveFeature() {
        if (this.featureForm.invalid) return;
        this.loading.set(true);
        const val = this.featureForm.value;

        // Parse IDs
        const ids = (val.tenant_ids as string)
            ? (val.tenant_ids as string).split(',').map((id: string) => parseInt(id.trim())).filter((n: number) => !isNaN(n))
            : [];

        const body: any = {
            name: val.name!,
            description: val.description!,
            rollout_percentage: val.rollout_percentage!,
            filters: { tenant_ids: ids },
            is_enabled: this.editingFeature() ? this.editingFeature()!.is_enabled : false // maintain status or default false
        };

        if (this.editingFeature()) {
            this.api.invoke(updateFeatureApiV1AdminFeaturesFeatureIdPut, {
                feature_id: this.editingFeature()!.id as number,
                body: body
            }).then(() => {
                this.finishSave();
            });
        } else {
            this.api.invoke(createFeatureApiV1AdminFeaturesPost, {
                body: body
            }).then(() => {
                this.finishSave();
            });
        }
    }

    finishSave() {
        this.loading.set(false);
        this.showModal.set(false);
        this.loadFeatures();
    }

    toggleFeature(feature: FeatureFlag) {
        if (!confirm(`Are you sure you want to ${feature.is_enabled ? 'disable' : 'enable'} feature ${feature.name}?`)) return;
        this.api.invoke(toggleFeatureStatusApiV1AdminFeaturesFeatureIdTogglePost, {
            feature_id: feature.id as number,
            is_enabled: !feature.is_enabled
        }).then(() => this.loadFeatures());
    }
}
