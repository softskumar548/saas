import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Api, TenantSalesView, listAssignedTenantsApiV1FleeterTenantsGet, resendInviteApiV1FleeterTenantsTenantIdResendInvitePost, escalateToSupportApiV1FleeterTenantsTenantIdEscalatePost } from '@shared/api-client';

@Component({
  selector: 'lib-fleeter-tenants',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-8 max-w-7xl mx-auto">
      <div class="flex justify-between items-center mb-10">
        <div>
          <h1 class="text-4xl font-black text-gray-900 uppercase tracking-tighter">My Tenants</h1>
          <p class="text-gray-500 font-bold uppercase text-xs tracking-widest mt-1">Track and support your converted accounts.</p>
        </div>
        <div class="flex gap-4">
            <div class="px-6 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                <span class="w-3 h-3 rounded-full bg-green-500"></span>
                <span class="text-xs font-black uppercase tracking-widest text-gray-600">{{ activeTenantsCount() }} Active</span>
            </div>
            <div class="px-6 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                <span class="w-3 h-3 rounded-full bg-red-500"></span>
                <span class="text-xs font-black uppercase tracking-widest text-gray-600">{{ lowUsageCount() }} Low Usage</span>
            </div>
        </div>
      </div>

      <div *ngIf="loading()" class="py-20 text-center">
        <div class="animate-spin inline-block w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full mb-4"></div>
        <p class="text-gray-500 font-black uppercase text-xs tracking-widest">Loading Portfolio...</p>
      </div>

      <div *ngIf="!loading() && tenants().length === 0" class="bg-white rounded-[40px] p-20 text-center border-2 border-dashed border-gray-100">
        <div class="text-6xl mb-6">🏜️</div>
        <h3 class="text-2xl font-black text-gray-900 uppercase">No managed tenants</h3>
        <p class="text-gray-500 max-w-xs mx-auto mb-8 font-medium">Once you convert leads and finalize onboarding, they will appear in your management dashboard.</p>
      </div>

      <div *ngIf="!loading() && tenants().length > 0" class="grid grid-cols-1 gap-6">
        <div *ngFor="let tenant of tenants()" 
             class="group bg-white rounded-[32px] border border-gray-100 shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden">
          <div class="p-8 flex flex-col lg:flex-row items-start lg:items-center gap-8">
            
            <!-- Branding/Info -->
            <div class="flex-1 min-w-[300px]">
                <div class="flex items-center gap-3 mb-3">
                    <div [class]="'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ' + (tenant.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')">
                        {{ tenant.is_active ? 'Active' : 'Inactive' }}
                    </div>
                    <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ref: {{ tenant.slug }}</span>
                </div>
                <h3 class="text-2xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors">{{ tenant.name }}</h3>
                <p class="text-gray-400 text-sm font-bold flex items-center gap-2 mt-1">
                    <span>📅 Activated {{ tenant.created_at | date:'mediumDate' }}</span>
                    <span class="text-gray-200">|</span>
                    <span>⭐ {{ tenant.plan_name }} Plan</span>
                </p>
            </div>

            <!-- Usage Snapshot -->
            <div class="flex gap-8 px-8 border-l border-r border-gray-50">
                <div class="text-center">
                    <p class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Forms</p>
                    <p class="text-xl font-black text-gray-900">{{ tenant.usage.forms_count }}</p>
                </div>
                <div class="text-center">
                    <p class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Locations</p>
                    <p class="text-xl font-black text-gray-900">{{ tenant.usage.locations_count }}</p>
                </div>
                <div class="text-center">
                    <p class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Feedback</p>
                    <p class="text-xl font-black text-indigo-600">{{ tenant.usage.submissions_count }}</p>
                </div>
            </div>

            <!-- Flags -->
            <div class="flex-1 flex flex-wrap gap-2 min-w-[200px]">
                <div *ngFor="let flag of tenant.flags" 
                     [class]="'px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ' + getFlagClass(flag)">
                   <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                   {{ flag }}
                </div>
                <div *ngIf="tenant.flags.length === 0" class="text-gray-300 text-[10px] font-black uppercase tracking-widest italic">
                    Healthy Account
                </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-2">
                <button (click)="viewOnboarding(tenant)" 
                        class="p-4 bg-gray-50 text-gray-500 rounded-2xl hover:bg-gray-100 hover:text-gray-900 transition-all group/btn relative"
                        title="View Onboarding">
                    📋
                </button>
                <button (click)="resendInvite(tenant)" 
                        class="p-4 bg-gray-50 text-gray-500 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                        title="Resend Invite">
                    📧
                </button>
                <button (click)="openEscalateModal(tenant)" 
                        class="p-4 bg-gray-50 text-gray-500 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all"
                        title="Escalate Issue">
                    ⚠️
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Escalation Modal -->
    <div *ngIf="showEscalateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" (click)="closeEscalateModal()"></div>
      <div class="relative bg-white w-full max-w-lg rounded-[40px] shadow-2xl p-10 animate-in fade-in zoom-in duration-300">
          <h2 class="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-2">Escalate to Support</h2>
          <p class="text-gray-500 text-sm font-bold uppercase tracking-widest mb-8">Tenant: {{ selectedTenant?.name }}</p>
          
          <div class="space-y-6">
              <div>
                  <label class="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Reason for Escalation</label>
                  <textarea [(ngModel)]="escalateReason" rows="5" 
                            class="w-full p-6 rounded-3xl bg-gray-50 border-gray-100 text-sm font-medium focus:ring-red-500 focus:border-red-500 outline-none"
                            placeholder="Describe the issue or obstacle..."></textarea>
              </div>
              <div class="flex gap-4">
                  <button (click)="closeEscalateModal()" class="flex-1 py-4 bg-gray-50 text-gray-500 rounded-3xl text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-all">Cancel</button>
                  <button (click)="submitEscalation()" class="flex-[2] py-4 bg-red-600 text-white rounded-3xl text-xs font-black uppercase tracking-widest hover:bg-red-700 shadow-xl shadow-red-200 transition-all">Create Ticket</button>
              </div>
          </div>
      </div>
    </div>
  `
})
export class FleeterTenantsComponent implements OnInit {
  private api = inject(Api);
  private router = inject(Router);

  tenants = signal<TenantSalesView[]>([]);
  loading = signal(true);

  showEscalateModal = false;
  selectedTenant: TenantSalesView | null = null;
  escalateReason = '';

  activeTenantsCount = signal(0);
  lowUsageCount = signal(0);

  ngOnInit() {
    this.loadTenants();
  }

  loadTenants() {
    this.loading.set(true);
    this.api.invoke(listAssignedTenantsApiV1FleeterTenantsGet, {}).then((res: any) => {
      this.tenants.set(res);
      this.calculateStats(res);
      this.loading.set(false);
    });
  }

  calculateStats(items: TenantSalesView[]) {
    this.activeTenantsCount.set(items.filter(t => t.is_active).length);
    this.lowUsageCount.set(items.filter(t => t.flags.includes('Low Usage')).length);
  }

  getFlagClass(flag: string): string {
    switch (flag) {
      case 'Low Usage': return 'bg-orange-50 text-orange-600';
      case 'Trial Expiring': return 'bg-red-50 text-red-600';
      case 'Inactive': return 'bg-gray-100 text-gray-500';
      default: return 'bg-blue-50 text-blue-600';
    }
  }

  viewOnboarding(tenant: TenantSalesView) {
    if (tenant.onboarding_id) {
      this.router.navigate(['/fleeter/onboarding'], { queryParams: { id: tenant.onboarding_id } });
    }
  }

  resendInvite(tenant: TenantSalesView) {
    this.api.invoke(resendInviteApiV1FleeterTenantsTenantIdResendInvitePost, {
      tenant_id: tenant.id
    }).then(res => {
      alert((res as any).message);
    });
  }

  openEscalateModal(tenant: TenantSalesView) {
    this.selectedTenant = tenant;
    this.showEscalateModal = true;
    this.escalateReason = '';
  }

  closeEscalateModal() {
    this.showEscalateModal = false;
    this.selectedTenant = null;
  }

  submitEscalation() {
    if (!this.selectedTenant || !this.escalateReason) return;

    this.api.invoke(escalateToSupportApiV1FleeterTenantsTenantIdEscalatePost, {
      tenant_id: this.selectedTenant.id,
      reason: this.escalateReason
    }).then(res => {
      alert((res as any).message);
      this.closeEscalateModal();
    });
  }
}
