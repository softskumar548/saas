import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Api, OnboardingWithTenant, OnboardingStatus, OnboardingUpdate, listOnboardingApiV1OnboardingGet, updateOnboardingApiV1OnboardingIdPatch } from '@shared/api-client';

@Component({
  selector: 'lib-fleeter-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-8 max-w-7xl mx-auto">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-black text-gray-900 uppercase tracking-tighter">Onboarding Pipeline</h1>
          <p class="text-gray-500 font-medium">Coordinate the transition from lead to live tenant.</p>
        </div>
      </div>

      <div *ngIf="loading()" class="py-20 text-center">
        <div class="animate-spin inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-4"></div>
        <p class="text-gray-500 font-bold uppercase text-xs tracking-widest">Synchronizing Pipeline...</p>
      </div>

      <div *ngIf="!loading() && onboardingItems().length === 0" class="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-gray-100">
        <div class="text-5xl mb-4">🚢</div>
        <h3 class="text-xl font-bold text-gray-900">No active onboardings</h3>
        <p class="text-gray-500 max-w-xs mx-auto mb-6">When you convert a lead, they will appear here to begin their journey.</p>
      </div>

      <div *ngIf="!loading() && onboardingItems().length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let item of onboardingItems()" 
             class="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 p-8 flex flex-col cursor-pointer"
             (click)="openItem(item)">
          
          <div class="flex justify-between items-start mb-6">
            <div [class]="'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ' + getStatusClass(item.status || '')">
              {{ item.status }}
            </div>
            <div class="text-[10px] font-black text-gray-400 uppercase tracking-widest">{{ item.created_at | date:'MMM d' }}</div>
          </div>

          <h3 class="text-xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors mb-2">{{ item.tenant_name }}</h3>
          
          <!-- Progress Bar -->
          <div class="mt-4 mb-6">
            <div class="flex justify-between text-[10px] font-black uppercase text-gray-400 mb-2">
              <span>Implementation Progress</span>
              <span>{{ getProgressText(item) }}</span>
            </div>
            <div class="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
              <div class="h-full bg-indigo-600 transition-all duration-1000" [style.width.%]="getProgress(item)"></div>
            </div>
          </div>

          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <span [class]="'w-5 h-5 rounded-full flex items-center justify-center text-[10px] ' + (item.owner_invited ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400')">
                {{ item.owner_invited ? '✓' : '1' }}
              </span>
              <span [class]="'text-xs font-bold ' + (item.owner_invited ? 'text-gray-900' : 'text-gray-400')">Owner Invited</span>
            </div>
            <div class="flex items-center gap-3">
              <span [class]="'w-5 h-5 rounded-full flex items-center justify-center text-[10px] ' + (item.branding_configured ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400')">
                {{ item.branding_configured ? '✓' : '2' }}
              </span>
              <span [class]="'text-xs font-bold ' + (item.branding_configured ? 'text-gray-900' : 'text-gray-400')">Branding Configured</span>
            </div>
            <div class="flex items-center gap-3">
              <span [class]="'w-5 h-5 rounded-full flex items-center justify-center text-[10px] ' + (item.form_created ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400')">
                {{ item.form_created ? '✓' : '3' }}
              </span>
              <span [class]="'text-xs font-bold ' + (item.form_created ? 'text-gray-900' : 'text-gray-400')">First Form Ready</span>
            </div>
          </div>

          <button class="mt-8 w-full py-3 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all">Manage Implementation</button>
        </div>
      </div>
    </div>

    <!-- Implementation Modal -->
    <div *ngIf="selectedItem" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" (click)="closeModal()"></div>
      <div class="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div class="p-10">
          <div class="flex justify-between items-start mb-10">
            <div>
              <h2 class="text-3xl font-black text-gray-900 uppercase tracking-tighter">{{ selectedItem.tenant_name }}</h2>
              <p class="text-gray-500 font-bold uppercase text-[10px] tracking-widest mt-1">Tenant ID: #{{ selectedItem.tenant_id }}</p>
            </div>
            <button (click)="closeModal()" class="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors">✕</button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
            <!-- Checklist -->
            <div class="space-y-6">
              <h3 class="text-xs font-black uppercase tracking-widest text-indigo-600">Onboarding Checklist</h3>
              
              <div class="space-y-4">
                 <label class="flex items-center gap-4 p-4 rounded-3xl bg-gray-50 border border-gray-100 cursor-pointer hover:bg-white transition-all group">
                    <input type="checkbox" [(ngModel)]="editForm.owner_invited" class="w-6 h-6 rounded-lg text-indigo-600 focus:ring-0 border-gray-300 cursor-pointer">
                    <div>
                      <p class="text-sm font-black text-gray-900 uppercase tracking-tight">Owner Invited</p>
                      <p class="text-[10px] text-gray-500 font-bold uppercase">Credentials sent to customer</p>
                    </div>
                 </label>

                 <label class="flex items-center gap-4 p-4 rounded-3xl bg-gray-50 border border-gray-100 cursor-pointer hover:bg-white transition-all group">
                    <input type="checkbox" [(ngModel)]="editForm.branding_configured" class="w-6 h-6 rounded-lg text-indigo-600 focus:ring-0 border-gray-300 cursor-pointer">
                    <div>
                      <p class="text-sm font-black text-gray-900 uppercase tracking-tight">Branding Configured</p>
                      <p class="text-[10px] text-gray-500 font-bold uppercase">Colors, logo & letterhead set</p>
                    </div>
                 </label>

                 <label class="flex items-center gap-4 p-4 rounded-3xl bg-gray-50 border border-gray-100 cursor-pointer hover:bg-white transition-all group">
                    <input type="checkbox" [(ngModel)]="editForm.form_created" class="w-6 h-6 rounded-lg text-indigo-600 focus:ring-0 border-gray-300 cursor-pointer">
                    <div>
                      <p class="text-sm font-black text-gray-900 uppercase tracking-tight">First Form Ready</p>
                      <p class="text-[10px] text-gray-500 font-bold uppercase">Feedback schema implemented</p>
                    </div>
                 </label>

                 <label class="flex items-center gap-4 p-4 rounded-3xl bg-gray-50 border border-gray-100 cursor-pointer hover:bg-white transition-all group">
                    <input type="checkbox" [(ngModel)]="editForm.qr_generated" class="w-6 h-6 rounded-lg text-indigo-600 focus:ring-0 border-gray-300 cursor-pointer">
                    <div>
                      <p class="text-sm font-black text-gray-900 uppercase tracking-tight">QR Generated</p>
                      <p class="text-[10px] text-gray-500 font-bold uppercase">Locations and codes created</p>
                    </div>
                 </label>
              </div>
            </div>

            <!-- Meta -->
            <div class="flex flex-col h-full">
               <h3 class="text-xs font-black uppercase tracking-widest text-indigo-600 mb-6">Status & Notes</h3>
               
               <select [(ngModel)]="editForm.status" class="w-full p-4 rounded-3xl bg-gray-50 border-gray-100 text-sm font-black uppercase tracking-widest mb-6 focus:ring-indigo-500 focus:border-indigo-500">
                 <option value="pending">Pending</option>
                 <option value="in_progress">In Progress</option>
                 <option value="completed">Completed</option>
               </select>

               <textarea [(ngModel)]="editForm.notes" rows="6" placeholder="Implementation notes, obstacles, or internal comments..." 
                         class="w-full p-6 rounded-[30px] bg-gray-50 border-gray-100 text-sm font-medium resize-none focus:ring-indigo-500 focus:border-indigo-500"></textarea>
               
               <div class="pt-10">
                  <button (click)="saveItem()" class="w-full py-4 bg-indigo-600 text-white rounded-3xl text-sm font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all">Update Pipeline</button>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; background: #fdfdfd; min-height: 100vh; }
  `]
})
export class FleeterOnboardingComponent implements OnInit {
  private api = inject(Api);
  private route = inject(ActivatedRoute);
  onboardingItems = signal<OnboardingWithTenant[]>([]);
  loading = signal(true);

  selectedItem: OnboardingWithTenant | null = null;
  editForm: OnboardingUpdate = {
    status: 'pending' as OnboardingStatus,
    owner_invited: false,
    branding_configured: false,
    form_created: false,
    qr_generated: false,
    notes: ''
  };

  ngOnInit() {
    this.loadOnboarding();
  }

  loadOnboarding() {
    this.loading.set(true);
    this.api.invoke(listOnboardingApiV1OnboardingGet, {}).then((res: any) => {
      this.onboardingItems.set(res);
      this.loading.set(false);

      // Check for deep link from Tenants view
      const targetId = this.route.snapshot.queryParamMap.get('id');
      if (targetId) {
        const item = res.find((i: any) => i.id === parseInt(targetId));
        if (item) this.openItem(item);
      }
    });
  }

  openItem(item: OnboardingWithTenant) {
    this.selectedItem = item;
    this.editForm = {
      status: item.status,
      owner_invited: item.owner_invited,
      branding_configured: item.branding_configured,
      form_created: item.form_created,
      qr_generated: item.qr_generated,
      notes: item.notes || ''
    };
  }

  closeModal() {
    this.selectedItem = null;
  }

  saveItem() {
    if (!this.selectedItem) return;

    this.api.invoke(updateOnboardingApiV1OnboardingIdPatch, {
      id: this.selectedItem.id,
      body: this.editForm
    }).then(() => {
      this.closeModal();
      this.loadOnboarding();
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending': return 'bg-yellow-50 text-yellow-700 border border-yellow-100';
      case 'in_progress': return 'bg-indigo-50 text-indigo-700 border border-indigo-100';
      case 'completed': return 'bg-green-50 text-green-700 border border-green-100';
      default: return 'bg-gray-50 text-gray-700 border border-gray-100';
    }
  }

  getProgress(item: OnboardingWithTenant): number {
    const steps = [item.owner_invited, item.branding_configured, item.form_created, item.qr_generated];
    const completed = steps.filter(s => s).length;
    return (completed / steps.length) * 100;
  }

  getProgressText(item: OnboardingWithTenant): string {
    const steps = [item.owner_invited, item.branding_configured, item.form_created, item.qr_generated];
    const completed = steps.filter(s => s).length;
    return `${completed}/${steps.length} Steps`;
  }
}
