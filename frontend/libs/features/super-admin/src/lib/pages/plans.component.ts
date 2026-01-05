import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Api, SubscriptionPlan, listPlansApiV1AdminPlansGet, createPlanApiV1AdminPlansPost, updatePlanApiV1AdminPlansPlanIdPut, togglePlanStatusApiV1AdminPlansPlanIdStatusPost, setDefaultPlanApiV1AdminPlansPlanIdDefaultPost } from '@shared/api-client';

@Component({
    selector: 'lib-sa-plans',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
    <div class="p-8">
      <div class="flex justify-between items-center mb-8">
        <div>
           <h1 class="text-3xl font-bold text-gray-900">Subscription Plans</h1>
           <p class="text-gray-500 mt-1">Manage monetization and feature limits.</p>
        </div>
        <button (click)="openCreateModal()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium shadow-sm transition-colors">
            + Create Plan
        </button>
      </div>

      <!-- Plans Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let plan of plans()" class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow relative">
           
           <!-- Status Badges -->
           <div class="absolute top-4 right-4 flex gap-2">
                <span *ngIf="plan.is_default" class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full border border-yellow-200">DEFAULT</span>
                <span *ngIf="plan.is_active" class="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full border border-green-200">ACTIVE</span>
                <span *ngIf="!plan.is_active" class="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full border border-gray-200">INACTIVE</span>
           </div>

           <div class="p-6">
              <h3 class="text-xl font-bold text-gray-900 mb-2">{{ plan.name }}</h3>
              <div class="flex items-baseline mb-6">
                <span class="text-3xl font-extrabold text-gray-900">\${{ plan.price_monthly }}</span>
                <span class="ml-1 text-gray-500">/mo</span>
              </div>
              <p class="text-sm text-gray-600 mb-6 h-10 line-clamp-2">{{ plan.description || 'No description provided.' }}</p>
              
              <div class="space-y-3 mb-6">
                 <div class="flex items-center text-sm text-gray-600">
                    <span class="w-6 text-center mr-2">📝</span> 
                    <span class="font-medium">{{ plan.max_forms }}</span> forms
                 </div>
                 <div class="flex items-center text-sm text-gray-600">
                    <span class="w-6 text-center mr-2">📊</span> 
                    <span class="font-medium">{{ plan.max_responses_per_month }}</span> responses/mo
                 </div>
                 <div class="flex items-center text-sm text-gray-600">
                    <span class="w-6 text-center mr-2">📍</span> 
                    <span class="font-medium">{{ plan.max_locations }}</span> locations
                 </div>
                 <div class="flex items-center text-sm text-gray-600">
                    <span class="w-6 text-center mr-2">👥</span> 
                    <span class="font-medium">{{ plan.max_team_members }}</span> team members
                 </div>
              </div>

              <div class="flex border-t border-gray-100 pt-4 gap-2">
                 <button (click)="openEditModal(plan)" class="flex-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded text-sm font-medium transition-colors">
                    Edit
                 </button>
                 <button *ngIf="!plan.is_default" (click)="setDefault(plan)" class="px-3 py-2 text-yellow-600 hover:bg-yellow-50 rounded text-sm font-medium transition-colors" title="Set as Default">
                    ★
                 </button>
                  <button (click)="toggleStatus(plan)" class="px-3 py-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded text-sm font-medium transition-colors" [title]="plan.is_active ? 'Deactivate' : 'Activate'">
                    {{ plan.is_active ? '🚫' : '✅' }}
                 </button>
              </div>
           </div>
        </div>
      </div>

      <!-- Create/Edit Modal -->
      <div *ngIf="showModal()" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
         <div class="bg-white rounded-xl shadow-xl p-8 w-full max-w-lg animate-in fade-in zoom-in duration-200 my-8">
            <h2 class="text-2xl font-bold mb-6">{{ editingPlan() ? 'Edit Plan' : 'Create Plan' }}</h2>
            
            <form [formGroup]="planForm" (ngSubmit)="savePlan()">
                <div class="space-y-4">
                    <!-- Basic Info -->
                    <div class="grid grid-cols-2 gap-4">
                        <div class="col-span-2">
                           <label class="block text-sm font-medium text-gray-700">Plan Name</label>
                           <input formControlName="name" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 border">
                        </div>
                         <div class="col-span-1">
                           <label class="block text-sm font-medium text-gray-700">Price ($)</label>
                           <input formControlName="price_monthly" type="number" min="0" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 border">
                        </div>
                         <div class="col-span-1">
                           <label class="block text-sm font-medium text-gray-700">Billing Cycle</label>
                           <select formControlName="billing_cycle" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 border bg-white">
                               <option value="monthly">Monthly</option>
                               <option value="yearly">Yearly</option>
                           </select>
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700">Description</label>
                        <textarea formControlName="description" rows="2" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 border"></textarea>
                    </div>

                    <!-- Limits -->
                    <div class="border-t border-gray-200 pt-4 mt-4">
                        <h4 class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Limits</h4>
                        <div class="grid grid-cols-2 gap-4">
                             <div>
                                <label class="block text-sm font-medium text-gray-700">Max Forms</label>
                                <input formControlName="max_forms" type="number" min="-1" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 border">
                             </div>
                             <div>
                                <label class="block text-sm font-medium text-gray-700">Responses / Mo</label>
                                <input formControlName="max_responses_per_month" type="number" min="-1" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 border">
                             </div>
                             <div>
                                <label class="block text-sm font-medium text-gray-700">Max Locations</label>
                                <input formControlName="max_locations" type="number" min="1" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 border">
                             </div>
                             <div>
                                <label class="block text-sm font-medium text-gray-700">Max Team Members</label>
                                <input formControlName="max_team_members" type="number" min="1" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 border">
                             </div>
                        </div>
                         <p class="text-xs text-gray-500 mt-2">* Use -1 for unlimited (if supported by backend logic).</p>
                    </div>
                </div>

                <div class="mt-8 flex justify-end gap-3">
                    <button type="button" (click)="showModal.set(false)" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                    <button type="submit" [disabled]="planForm.invalid || loading()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                        {{ loading() ? 'Saving...' : 'Save Plan' }}
                    </button>
                </div>
            </form>
         </div>
      </div>
    </div>
  `
})
export class PlansComponent {
    private api = inject(Api);
    private fb = inject(FormBuilder);

    plans = signal<SubscriptionPlan[]>([]);
    showModal = signal(false);
    editingPlan = signal<SubscriptionPlan | null>(null);
    loading = signal(false);

    planForm = this.fb.group({
        name: ['', Validators.required],
        price_monthly: [0, [Validators.required, Validators.min(0)]],
        billing_cycle: ['monthly', Validators.required],
        description: [''],
        max_forms: [5, [Validators.required]],
        max_responses_per_month: [100, [Validators.required]],
        max_locations: [1, [Validators.required, Validators.min(1)]],
        max_team_members: [1, [Validators.required, Validators.min(1)]]
    });

    constructor() {
        this.loadPlans();
    }

    loadPlans() {
        this.api.invoke(listPlansApiV1AdminPlansGet, { skip: 0, limit: 100 }).then(res => {
            this.plans.set(res);
        });
    }

    openCreateModal() {
        this.editingPlan.set(null);
        this.planForm.reset({
            name: '',
            price_monthly: 0,
            billing_cycle: 'monthly',
            description: '',
            max_forms: 5,
            max_responses_per_month: 100,
            max_locations: 1,
            max_team_members: 1
        });
        this.showModal.set(true);
    }

    openEditModal(plan: SubscriptionPlan) {
        this.editingPlan.set(plan);
        this.planForm.patchValue({
            name: plan.name,
            price_monthly: plan.price_monthly,
            billing_cycle: plan.billing_cycle || 'monthly',
            description: plan.description || '',
            max_forms: plan.max_forms,
            max_responses_per_month: plan.max_responses_per_month,
            max_locations: plan.max_locations,
            max_team_members: plan.max_team_members
        });
        this.showModal.set(true);
    }

    savePlan() {
        if (this.planForm.invalid) return;
        this.loading.set(true);
        const val = this.planForm.value;

        const body: any = {
            name: val.name!,
            price_monthly: val.price_monthly!,
            billing_cycle: val.billing_cycle!,
            description: val.description!,
            max_forms: val.max_forms!,
            max_responses_per_month: val.max_responses_per_month!,
            max_locations: val.max_locations!,
            max_team_members: val.max_team_members!
        };

        if (this.editingPlan()) {
            this.api.invoke(updatePlanApiV1AdminPlansPlanIdPut, {
                plan_id: this.editingPlan()!.id as number,
                body: body
            }).then(() => {
                this.finishSave();
            }).catch(err => {
                console.error(err);
                this.loading.set(false);
                alert('Failed to update plan.');
            });
        } else {
            // New plan defaults
            body.is_active = true;
            body.is_default = false;

            this.api.invoke(createPlanApiV1AdminPlansPost, {
                body: body
            }).then(() => {
                this.finishSave();
            }).catch(err => {
                console.error(err);
                this.loading.set(false);
                alert('Failed to create plan.');
            });
        }
    }

    finishSave() {
        this.loading.set(false);
        this.showModal.set(false);
        this.loadPlans();
    }

    toggleStatus(plan: SubscriptionPlan) {
        if (!confirm(`Are you sure you want to ${plan.is_active ? 'deactivate' : 'activate'} plan ${plan.name}?`)) return;
        this.api.invoke(togglePlanStatusApiV1AdminPlansPlanIdStatusPost, {
            plan_id: plan.id as number,
            is_active: !plan.is_active
        }).then(() => this.loadPlans());
    }

    setDefault(plan: SubscriptionPlan) {
        if (!confirm(`Are you sure you want to set ${plan.name} as the default plan?`)) return;
        this.api.invoke(setDefaultPlanApiV1AdminPlansPlanIdDefaultPost, {
            plan_id: plan.id as number
        }).then(() => this.loadPlans());
    }
}
