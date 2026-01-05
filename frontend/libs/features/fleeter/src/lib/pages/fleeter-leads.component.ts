import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Api } from '@shared/api-client';
import { LeadRead, LeadStatus, LeadCreate, LeadUpdate } from '@shared/api-client';
import { listLeadsApiV1LeadsGet, createLeadApiV1LeadsPost, updateLeadApiV1LeadsIdPatch, convertLeadToTenantApiV1LeadsIdConvertPost, createFollowUpApiV1LeadsIdFollowUpsPost } from '@shared/api-client';

@Component({
  selector: 'lib-fleeter-leads',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight">Leads Management</h1>
          <p class="text-gray-500 mt-1 font-medium">Track and nurture your potential customers.</p>
        </div>
        <button (click)="openModal()" class="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2">
          <span>+</span> Add New Lead
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div class="relative flex-1">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            (input)="loadLeads()"
            placeholder="Search business or contact..." 
            class="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          >
        </div>
        <select 
          [(ngModel)]="statusFilter" 
          (change)="loadLeads()"
          class="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        >
          <option value="">All Statuses</option>
          <option *ngFor="let s of statuses" [value]="s">{{ s | titlecase }}</option>
        </select>
      </div>

      <!-- Content -->
      <div *ngIf="loading" class="flex justify-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>

      <div *ngIf="!loading && leads.length === 0" class="bg-white rounded-3xl shadow-sm border border-gray-100 p-20 text-center space-y-4">
        <div class="text-6xl">🎯</div>
        <h3 class="text-xl font-bold text-gray-900">No leads found</h3>
        <p class="text-gray-500 max-w-xs mx-auto">Try adjusting your filters or add your first prospect to get started.</p>
        <button (click)="openModal()" class="text-indigo-600 font-bold hover:underline">Add your first lead →</button>
      </div>

      <div *ngIf="!loading && leads.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let lead of leads" class="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-6 group relative">
          <div class="flex justify-between items-start mb-4">
            <div [class]="'px-3 py-1 rounded-full text-[10px] font-black uppercase ' + getStatusClass(lead.status || '')">
              {{ lead.status }}
            </div>
            <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Added {{ lead.created_at | date:'MMM d' }}</div>
          </div>
          
          <h3 class="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{{ lead.business_name }}</h3>
          <div class="mt-2 space-y-2">
            <div class="flex items-center gap-2 text-sm text-gray-600">
              <span class="text-gray-400">👤</span> {{ lead.contact_person }}
            </div>
            <div *ngIf="lead.email" class="flex items-center gap-2 text-sm text-gray-600">
              <span class="text-gray-400">✉️</span> {{ lead.email }}
            </div>
          </div>

          <div class="mt-6 flex flex-wrap gap-2 pt-6 border-t border-gray-50">
            <button (click)="openModal(lead)" class="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors">Edit</button>
            <button (click)="openFollowUpModal(lead)" class="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors">Follow-up</button>
            <button *ngIf="lead.status !== 'converted'" (click)="convertLead(lead)" class="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-bold hover:bg-green-100 transition-colors">Convert</button>
          </div>
        </div>
      </div>

      <!-- Lead Modal -->
      <div *ngIf="showModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
          <div class="p-8 border-b border-gray-50 flex justify-between items-center">
            <h2 class="text-2xl font-black text-gray-900">{{ editingLead ? 'Edit Lead' : 'New Lead' }}</h2>
            <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>
          
          <form [formGroup]="leadForm" (ngSubmit)="saveLead()" class="p-8 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="col-span-2">
                <label class="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 block">Business Name</label>
                <input type="text" formControlName="business_name" class="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500">
              </div>
              <div>
                <label class="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 block">Contact Person</label>
                <input type="text" formControlName="contact_person" class="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500">
              </div>
              <div>
                <label class="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 block">Business Type</label>
                <input type="text" formControlName="business_type" class="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500">
              </div>
              <div>
                <label class="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 block">Email</label>
                <input type="email" formControlName="email" class="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500">
              </div>
              <div>
                <label class="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 block">Phone</label>
                <input type="text" formControlName="phone" class="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500">
              </div>
              <div class="col-span-2">
                <label class="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 block">Lead Status</label>
                <select formControlName="status" class="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option *ngFor="let s of statuses" [value]="s">{{ s | titlecase }}</option>
                </select>
              </div>
              <div class="col-span-2">
                <label class="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 block">Notes</label>
                <textarea formControlName="notes" rows="3" class="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
              </div>
            </div>
            
            <div class="pt-4 flex gap-3">
              <button type="button" (click)="closeModal()" class="flex-1 py-3 bg-gray-50 text-gray-600 rounded-xl font-bold hover:bg-gray-100 transition-colors">Cancel</button>
              <button type="submit" [disabled]="leadForm.invalid" class="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50">
                {{ editingLead ? 'Update Lead' : 'Create Lead' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Follow-up Modal -->
      <div *ngIf="showFollowUpModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
          <div class="p-8 border-b border-gray-50 flex justify-between items-center">
            <h2 class="text-xl font-black text-gray-900">Schedule Follow-up</h2>
            <button (click)="closeFollowUpModal()" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>
          
          <div class="p-8 space-y-4">
            <div>
              <label class="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 block">Date & Time</label>
              <input type="datetime-local" [(ngModel)]="followUpDate" class="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>
            <div>
              <label class="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 block">Notes</label>
              <textarea [(ngModel)]="followUpNotes" rows="3" class="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
            </div>
            
            <div class="pt-4 flex gap-3">
              <button (click)="closeFollowUpModal()" class="flex-1 py-3 bg-gray-50 text-gray-600 rounded-xl font-bold hover:bg-gray-100 transition-colors">Cancel</button>
              <button (click)="saveFollowUp()" [disabled]="!followUpDate" class="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50">
                Schedule
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class FleeterLeadsComponent implements OnInit {
  leads: LeadRead[] = [];
  loading = true;
  searchQuery = '';
  statusFilter = '';
  statuses: string[] = ['NEW', 'CONTACTED', 'DEMO_SCHEDULED', 'CONVERTED', 'DROPPED'];

  showModal = false;
  editingLead: LeadRead | null = null;
  leadForm: FormGroup;

  showFollowUpModal = false;
  selectedLeadForFollowUp: LeadRead | null = null;
  followUpDate = '';
  followUpNotes = '';

  constructor(private api: Api, private fb: FormBuilder) {
    this.leadForm = this.fb.group({
      business_name: ['', Validators.required],
      contact_person: ['', Validators.required],
      email: ['', [Validators.email]],
      phone: [''],
      business_type: [''],
      notes: [''],
      status: ['new', Validators.required]
    });
  }

  ngOnInit() {
    this.loadLeads();
  }

  async loadLeads() {
    this.loading = true;
    try {
      this.leads = await this.api.invoke(listLeadsApiV1LeadsGet, {
        search: this.searchQuery,
        status: (this.statusFilter as LeadStatus) || undefined
      });
    } catch (err) {
      console.error('Error loading leads', err);
    } finally {
      this.loading = false;
    }
  }

  openModal(lead?: LeadRead) {
    if (lead) {
      this.editingLead = lead;
      this.leadForm.patchValue(lead);
    } else {
      this.editingLead = null;
      this.leadForm.reset({ status: 'new' });
    }
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingLead = null;
  }

  async saveLead() {
    if (this.leadForm.invalid) return;

    try {
      if (this.editingLead) {
        await this.api.invoke(updateLeadApiV1LeadsIdPatch, {
          id: this.editingLead.id,
          body: this.leadForm.value as LeadUpdate
        });
      } else {
        await this.api.invoke(createLeadApiV1LeadsPost, {
          body: this.leadForm.value as LeadCreate
        });
      }
      this.closeModal();
      this.loadLeads();
    } catch (err) {
      console.error('Error saving lead', err);
    }
  }

  openFollowUpModal(lead: LeadRead) {
    this.selectedLeadForFollowUp = lead;
    this.showFollowUpModal = true;
  }

  closeFollowUpModal() {
    this.showFollowUpModal = false;
    this.selectedLeadForFollowUp = null;
    this.followUpDate = '';
    this.followUpNotes = '';
  }

  async saveFollowUp() {
    if (!this.selectedLeadForFollowUp || !this.followUpDate) return;

    try {
      await this.api.invoke(createFollowUpApiV1LeadsIdFollowUpsPost, {
        id: this.selectedLeadForFollowUp.id,
        body: {
          scheduled_at: new Date(this.followUpDate).toISOString(),
          notes: this.followUpNotes,
          lead_id: this.selectedLeadForFollowUp.id
        }
      });
      this.closeFollowUpModal();
    } catch (err) {
      console.error('Error saving follow-up', err);
    }
  }

  async convertLead(lead: LeadRead) {
    if (!confirm(`Are you sure you want to convert ${lead.business_name} to a tenant?`)) return;

    try {
      const result = await this.api.invoke(convertLeadToTenantApiV1LeadsIdConvertPost, {
        id: lead.id
      });
      alert(`Success! Tenant created.\nAdmin Email: ${result['admin_email']}\nPassword: ${result['temp_password']}`);
      this.loadLeads();
    } catch (err) {
      console.error('Error converting lead', err);
    }
  }

  getStatusClass(status: string): string {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'new': return 'bg-blue-100 text-blue-700';
      case 'contacted': return 'bg-yellow-100 text-yellow-700';
      case 'demo_scheduled': return 'bg-purple-100 text-purple-700';
      case 'converted': return 'bg-green-100 text-green-700';
      case 'dropped': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }
}
