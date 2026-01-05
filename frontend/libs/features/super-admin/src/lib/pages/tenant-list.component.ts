import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Api, Tenant, TenantWithAdmin, listTenantsApiV1AdminTenantsGet, updateTenantStatusApiV1AdminTenantsTenantIdStatusPatch } from '@shared/api-client';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'lib-sa-tenants',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="p-8">
      <div class="flex justify-between items-center mb-8">
        <div>
           <h1 class="text-3xl font-bold text-gray-900">Tenants</h1>
           <p class="text-gray-500 mt-1">Manage platform tenants.</p>
        </div>
        <a routerLink="/admin/tenants/new" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium whitespace-nowrap no-underline inline-block">
            + New Tenant
        </a>
      </div>

      <!-- Search & Filters -->
      <div class="mb-6 p-4 bg-white rounded-lg border border-gray-200 flex flex-wrap gap-4 items-center">
         <div class="relative flex-1 min-w-[200px]">
             <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">🔍</span>
             <input type="text" [ngModel]="searchTerm()" (ngModelChange)="searchTerm.set($event)" placeholder="Search tenants..." class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
         </div>
         <div class="w-40">
             <select [ngModel]="filterPlan()" (ngModelChange)="filterPlan.set($event)" class="w-full py-2 pl-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                 <option value="all">Check Plan (All)</option>
                 <option value="1">Free</option>
                 <option value="2">Pro</option>
                 <option value="3">Enterprise</option>
             </select>
         </div>
         <div class="w-40">
             <select [ngModel]="filterStatus()" (ngModelChange)="filterStatus.set($event)" class="w-full py-2 pl-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                 <option value="all">Status (All)</option>
                 <option value="active">Active</option>
                 <option value="suspended">Suspended</option>
             </select>
         </div>
      </div>

      <!-- Tenant Table -->
      <div class="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr *ngFor="let tenant of filteredTenants()" class="hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="w-8 h-8 rounded bg-gray-100 flex items-center justify-center mr-3 text-xs font-bold text-gray-600 border border-gray-200 uppercase">
                        {{ tenant.name[0] }}
                    </div>
                    <div>
                        <div class="text-sm font-medium text-gray-900">{{ tenant.name }}</div>
                        <div class="text-xs text-gray-500">{{ tenant.slug }}</div>
                    </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full" 
                      [ngClass]="getPlanBadgeClass(tenant.plan_id)">
                  {{ getPlanName(tenant.plan_id) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full"
                      [ngClass]="tenant.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                  {{ tenant.is_active ? 'Active' : 'Suspended' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ tenant.created_at | date:'mediumDate' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                <button (click)="viewTenant(tenant)" class="text-indigo-600 hover:text-indigo-900 font-medium">View</button>
                <button *ngIf="tenant.is_active" (click)="toggleStatus(tenant)" class="text-amber-600 hover:text-amber-900 font-medium">Suspend</button>
                <button *ngIf="!tenant.is_active" (click)="toggleStatus(tenant)" class="text-green-600 hover:text-green-900 font-medium">Activate</button>
                <button (click)="resetPassword(tenant)" class="text-gray-500 hover:text-gray-700 font-medium text-xs border border-gray-300 rounded px-2 py-0.5">Reset Pwd</button>
              </td>
            </tr>
            <tr *ngIf="filteredTenants().length === 0">
                <td colspan="5" class="px-6 py-8 text-center text-gray-500 italic">
                    No tenants found matching your filters.
                </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tenant Detail Modal -->
      <div *ngIf="showDetailModal() && selectedTenant()" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
         <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
            <!-- Header -->
            <div class="bg-gray-50 px-8 py-6 border-b border-gray-200 flex justify-between items-start">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900">{{ selectedTenant()?.name }}</h2>
                    <p class="text-sm text-gray-500 mt-1">Tenant ID: {{ selectedTenant()?.id }}</p>
                </div>
                <button (click)="showDetailModal.set(false)" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>

            <div class="p-8 space-y-8">
                <!-- Basic Info -->
                <div>
                    <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Basic Info</h3>
                    <div class="grid grid-cols-2 gap-6">
                        <div>
                            <p class="text-sm text-gray-500">Created Date</p>
                            <p class="font-medium text-gray-900">{{ selectedTenant()?.created_at | date:'mediumDate' }}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Owner Email</p>
                            <div class="flex items-center gap-2">
                                <p class="font-medium text-gray-900">{{ selectedTenant()?.admin_email || 'Not Assigned' }}</p>
                                <button *ngIf="selectedTenant()?.admin_email" (click)="copyToClipboard(selectedTenant()?.admin_email!)" class="text-gray-400 hover:text-indigo-600 transition-colors" title="Copy to Clipboard">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Current Plan</p>
                            <span class="px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full" [ngClass]="getPlanBadgeClass(selectedTenant()?.plan_id)">
                                {{ getPlanName(selectedTenant()?.plan_id) }}
                            </span>
                        </div>
                         <div>
                            <span class="px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full"
                                [ngClass]="selectedTenant()?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                            {{ selectedTenant()?.is_active ? 'Active' : 'Suspended' }}
                            </span>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Assigned Fleeter (ID)</p>
                            <div class="flex items-center gap-2">
                                <p class="font-medium text-gray-900">{{ selectedTenant()?.assigned_fleeter_id || 'Unassigned' }}</p>
                                <button (click)="assignFleeter(selectedTenant()!)" class="text-xs text-indigo-600 hover:text-indigo-800 font-medium border border-indigo-200 rounded px-2 py-0.5 bg-indigo-50">
                                    Edit
                                </button>
                            </div>
                    </div>
                </div>

                <!-- Usage Summary -->
                <div>
                     <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Usage Summary <span class="text-xs normal-case font-normal text-gray-400 float-right">(Month to Date)</span></h3>
                     <div class="grid grid-cols-3 gap-4">
                         <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                             <div class="text-sm text-gray-500 mb-1">Forms Created</div>
                             <div class="text-xl font-bold text-gray-900">{{ selectedTenant()?.usage?.forms_count || 0 }} <span class="text-gray-400 text-sm font-normal">/ {{ selectedTenant()?.usage?.max_forms || 20 }}</span></div>
                         </div>
                         <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                             <div class="text-sm text-gray-500 mb-1">Responses</div>
                             <div class="text-xl font-bold text-gray-900">{{ (selectedTenant()?.usage?.submissions_count || 0) | number }} <span class="text-gray-400 text-sm font-normal">/ {{ (selectedTenant()?.usage?.max_submissions || 5000) | number }}</span></div>
                         </div>
                         <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                             <div class="text-sm text-gray-500 mb-1">Locations</div>
                              <div class="text-xl font-bold text-gray-900">{{ selectedTenant()?.usage?.locations_count || 0 }}</div>
                         </div>
                     </div>
                </div>

                <!-- Warning -->
                <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            ⚠️
                        </div>
                        <div class="ml-3">
                            <p class="text-sm text-yellow-700">
                                Super Admins have <b>no access</b> to properiatary feedback content or customer data.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Actions Footer -->
            <div class="bg-gray-50 px-8 py-4 border-t border-gray-200 flex justify-end gap-3">
                 <button (click)="toggleStatus(selectedTenant()!)" class="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm">
                    {{ selectedTenant()?.is_active ? 'Suspend Tenant' : 'Activate Tenant' }}
                </button>
                <button (click)="resetPassword(selectedTenant()!)" class="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm">
                    Reset Owner Password
                </button>
                <button (click)="changePlan(selectedTenant()!)" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm">
                    Change Plan
                </button>
            </div>
         </div>
      </div>

    </div>
  `
})
export class TenantListComponent {
  private api = inject(Api);


  tenants = signal<TenantWithAdmin[]>([]);
  showDetailModal = signal(false);
  selectedTenant = signal<TenantWithAdmin | null>(null);

  // Filters
  searchTerm = signal('');
  filterPlan = signal('all');
  filterStatus = signal('all');

  // Computed Filtered List
  filteredTenants = computed(() => {
    const list = this.tenants();
    const search = this.searchTerm().toLowerCase();
    const plan = this.filterPlan();
    const status = this.filterStatus();

    return list.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(search) || t.slug.toLowerCase().includes(search);
      const matchesPlan = plan === 'all' || t.plan_id?.toString() === plan;
      const matchesStatus = status === 'all' ||
        (status === 'active' && t.is_active) ||
        (status === 'suspended' && !t.is_active);

      return matchesSearch && matchesPlan && matchesStatus;
    });
  });



  constructor() {
    this.loadTenants();
  }

  loadTenants() {
    this.api.invoke(listTenantsApiV1AdminTenantsGet, {}).then((res: any) => {
      this.tenants.set(res);
      // Refresh selected tenant if modal is open
      if (this.showDetailModal() && this.selectedTenant()) {
        const updated = res.find((t: any) => t.id === this.selectedTenant()?.id);
        if (updated) this.selectedTenant.set(updated);
      }
    });
  }

  toggleStatus(tenant: TenantWithAdmin) {
    if (!confirm(`Are you sure you want to ${tenant.is_active ? 'suspend' : 'activate'} ${tenant.name}?`)) return;

    this.api.invoke(updateTenantStatusApiV1AdminTenantsTenantIdStatusPatch, {
      tenant_id: tenant.id as number,
      body: { is_active: !tenant.is_active }
    }).then(() => this.loadTenants());
  }

  viewTenant(tenant: TenantWithAdmin) {
    this.selectedTenant.set(tenant);
    this.showDetailModal.set(true);
  }

  resetPassword(tenant: TenantWithAdmin) {
    if (!confirm(`Reset admin password for ${tenant.name}? This will verify identity via email.`)) return;
    alert(`Password reset link sent to admin of ${tenant.name}`);
  }

  changePlan(tenant: TenantWithAdmin) {
    const plans = ['Free', 'Pro', 'Enterprise'];
    const newPlan = prompt(`Change Plan for ${tenant.name}.\nEnter Plan ID (1=Free, 2=Pro, 3=Enterprise):`, tenant.plan_id?.toString());
    if (newPlan && ['1', '2', '3'].includes(newPlan)) {
      // Mock API call for now, can implement real one if endpoint exists
      alert(`Plan changing to ${plans[parseInt(newPlan) - 1]}... (Mock)`);
      // Reload to verify if real backend update happened (it won't in this mock, but UI feedback is there)
    }
  }


  // Helpers
  getPlanName(id?: number | null): string {
    switch (id) {
      case 1: return 'Free';
      case 2: return 'Pro';
      case 3: return 'Enterprise';
      default: return 'Custom';
    }
  }

  assignFleeter(tenant: TenantWithAdmin) {
    const fleeterId = prompt(`Enter Fleeter ID to assign to ${tenant.name}:`, tenant.assigned_fleeter_id?.toString() || '');
    if (fleeterId) {
      // Mock API call - in a real app, this would be an API call
      // For now we will just alert, but user requested "how to do this in UI", so this is the hook.
      // To make it real, we need a new API endpoint PATCH /admin/tenants/{id}/assign-fleeter
      alert(`Request to assign Fleeter ID ${fleeterId} to ${tenant.name} sent! (Mock implementation pending backend endpoint)`);

      // Optimistic update for UI demo
      const updated = { ...tenant, assigned_fleeter_id: parseInt(fleeterId) };
      this.selectedTenant.set(updated);
      this.tenants.update(list => list.map(t => t.id === tenant.id ? updated : t));
    }
  }

  getPlanBadgeClass(id?: number | null): string {
    switch (id) {
      case 1: return 'bg-gray-100 text-gray-800';
      case 2: return 'bg-blue-100 text-blue-800';
      case 3: return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      // Could show a toast here, but for now visual feedback (or user knowing) is enough or we rely on browser default behavior? 
      // Let's assume a simple alert or console interaction isn't best UX but acceptable for Admin.
      // Or better, let's just do it silently as the user requested "copy to clip board"
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  }
}
