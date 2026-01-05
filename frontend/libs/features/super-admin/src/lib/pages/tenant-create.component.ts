import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Api, createTenantAdminApiV1AdminTenantsPost } from '@shared/api-client';

@Component({
    selector: 'lib-sa-tenant-create',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    template: `
    <div class="max-w-3xl mx-auto p-8">
      <!-- Header -->
      <div class="mb-8 border-b border-gray-200 pb-4">
        <div class="flex items-center gap-4 text-sm text-gray-500 mb-2">
            <a routerLink="/admin/tenants" class="hover:text-gray-900">Tenants</a>
            <span>/</span>
            <span class="text-gray-900">New</span>
        </div>
        <h1 class="text-3xl font-bold text-gray-900">Onboard New Tenant</h1>
        <p class="text-gray-500 mt-1">Create a new tenant organization and set up their administrator account.</p>
      </div>

      <form [formGroup]="createForm" (ngSubmit)="createTenant()" class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="p-8 space-y-8">
            <!-- Organization Details -->
            <div>
                <h3 class="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <span class="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-bold">1</span>
                    Organization Details
                </h3>
                <div class="grid grid-cols-1 gap-6 pl-8">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                            <input formControlName="name" class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2.5 border" placeholder="e.g. Acme Corp">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
                            <div class="flex rounded-lg shadow-sm">
                                <span class="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                    app.saas.com/
                                </span>
                                <input formControlName="slug" class="block w-full min-w-0 rounded-none rounded-r-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500 p-2.5 border" placeholder="acme">
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Organization Address</label>
                        <textarea formControlName="address" rows="3" class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2.5 border" placeholder="Full legal address..."></textarea>
                    </div>

                    <!-- Billing Address -->
                    <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <label class="flex items-center gap-2 mb-3 cursor-pointer">
                            <input type="checkbox" formControlName="sameAsAddress" class="rounded text-purple-600 focus:ring-purple-500">
                            <span class="text-sm font-medium text-gray-700">Billing Address same as Organization Address</span>
                        </label>
                        <div class="transition-all duration-300" [class.opacity-50]="createForm.get('sameAsAddress')?.value">
                             <label class="block text-sm font-medium text-gray-700 mb-1">Billing Address</label>
                            <textarea formControlName="billing_address" rows="3" class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2.5 border bg-white" placeholder="Billing address if different..."></textarea>
                        </div>
                    </div>
                </div>
            </div>
            
            <hr class="border-gray-100">

            <!-- Admin User Details -->
            <div>
                <h3 class="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <span class="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-bold">2</span>
                    Tenant Administrator
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pl-8">
                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input formControlName="admin_full_name" class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2.5 border" placeholder="John Doe">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                        <input formControlName="admin_designation" class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2.5 border" placeholder="e.g. CEO">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                        <div class="flex rounded-lg shadow-sm">
                            <span class="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                +91
                            </span>
                            <input formControlName="admin_mobile" class="block w-full min-w-0 rounded-none rounded-r-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500 p-2.5 border" placeholder="98765 43210">
                        </div>
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email Address <span class="text-gray-400 font-normal">(User ID)</span></label>
                        <input type="email" formControlName="admin_email" class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2.5 border" placeholder="admin@company.com">
                    </div>
                </div>
            </div>

            <!-- Password Section -->
            <div class="pl-8">
                <div class="bg-blue-50 p-6 rounded-xl border border-blue-100">
                    <h3 class="text-sm font-bold text-blue-900 mb-4">Security Credentials</h3>
                    
                    <div class="space-y-4">
                        <div class="flex items-center gap-6">
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="radio" formControlName="should_auto_generate_password" [value]="true" class="text-blue-600 focus:ring-blue-500">
                                <span class="text-sm font-medium text-blue-900">Auto-generate Password</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="radio" formControlName="should_auto_generate_password" [value]="false" class="text-blue-600 focus:ring-blue-500">
                                <span class="text-sm font-medium text-blue-900">Set Manually</span>
                            </label>
                        </div>
                        
                        <div *ngIf="createForm.get('should_auto_generate_password')?.value" class="text-sm text-blue-700 bg-blue-100/50 p-3 rounded-lg flex items-start gap-2">
                            <span>ℹ️</span>
                            <p>A secure password will be automatically generated and emailed to <b>{{ createForm.get('admin_email')?.value || 'the admin' }}</b>.</p>
                        </div>

                        <div *ngIf="!createForm.get('should_auto_generate_password')?.value" class="animate-in fade-in slide-in-from-top-2 duration-200">
                            <label class="block text-sm font-medium text-blue-900 mb-1">Initial Password</label>
                            <div class="flex gap-2">
                                <input type="text" formControlName="admin_password" class="block w-full rounded-lg border-blue-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border font-mono" placeholder="Enter or generate...">
                                <button type="button" (click)="generatePassword()" class="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium whitespace-nowrap transition-colors">
                                    Generate
                                </button>
                            </div>
                            <p class="text-xs text-blue-500 mt-1">This password will be sent to the admin email.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="bg-gray-50 px-8 py-5 border-t border-gray-200 flex justify-end gap-3">
            <button type="button" routerLink="/admin/tenants" class="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 font-medium">Cancel</button>
            <button type="submit" [disabled]="createForm.invalid || creating()" class="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium shadow-sm flex items-center gap-2">
                <span *ngIf="creating()" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                {{ creating() ? 'Creating Tenant...' : 'Create Tenant' }}
            </button>
        </div>
      </form>
    </div>
  `
})
export class TenantCreateComponent {
    private api = inject(Api);
    private fb = inject(FormBuilder);
    private router = inject(Router);

    creating = signal(false);

    createForm = this.fb.group({
        name: ['', Validators.required],
        slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
        brand_color: ['#6366f1'],
        plan_id: [1], // Default to Free Plan
        address: [''],

        // Billing
        sameAsAddress: [true],
        billing_address: [''],

        // User
        admin_full_name: ['', Validators.required],
        admin_designation: [''],
        admin_mobile: ['', [Validators.pattern(/^(\+91|91)?[0-9]{10}$/)]],
        admin_email: ['', [Validators.required, Validators.email]],

        // Password Logic
        should_auto_generate_password: [true],
        admin_password: ['']
    });

    constructor() {
        // Conditional Validation for Password
        this.createForm.get('should_auto_generate_password')?.valueChanges.subscribe(auto => {
            const pwdControl = this.createForm.get('admin_password');
            if (auto) {
                pwdControl?.clearValidators();
                pwdControl?.setValue('');
            } else {
                pwdControl?.setValidators([Validators.required, Validators.minLength(6)]);
            }
            pwdControl?.updateValueAndValidity();
        });

        // Address Sync Loop
        this.createForm.get('address')?.valueChanges.subscribe(addr => {
            if (this.createForm.get('sameAsAddress')?.value) {
                this.createForm.patchValue({ billing_address: addr }, { emitEvent: false });
            }
        });

        this.createForm.get('sameAsAddress')?.valueChanges.subscribe(same => {
            if (same) {
                const addr = this.createForm.get('address')?.value;
                this.createForm.patchValue({ billing_address: addr });
                this.createForm.get('billing_address')?.disable();
            } else {
                this.createForm.get('billing_address')?.enable();
            }
        });

        // Initial State
        this.createForm.get('billing_address')?.disable();
    }

    createTenant() {
        if (this.createForm.invalid) return;

        this.creating.set(true);
        const val = this.createForm.getRawValue();

        this.api.invoke(createTenantAdminApiV1AdminTenantsPost, {
            body: {
                name: val.name!,
                slug: val.slug!,
                brand_color: val.brand_color!,
                plan_id: val.plan_id!,
                address: val.address,
                billing_address: val.billing_address,

                admin_email: val.admin_email!,
                admin_full_name: val.admin_full_name!,
                admin_designation: val.admin_designation,
                admin_mobile: this.formatMobile(val.admin_mobile),

                should_auto_generate_password: val.should_auto_generate_password!,
                admin_password: val.admin_password || undefined
            } as any
        }).then(() => {
            this.creating.set(false);
            alert(`Tenant created successfully! Credentials sent to ${val.admin_email}`);
            this.router.navigate(['/admin/tenants']);
        }).catch((err: any) => {
            console.error(err);
            this.creating.set(false);
            alert('Failed to create tenant. Slug may be taken or server error.');
        })
    }

    generatePassword() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        this.createForm.patchValue({ admin_password: password });
    }

    private formatMobile(mobile: string | null | undefined): string | null {
        if (!mobile) return null;
        // Strip spaces/dashes
        let cleaned = mobile.replace(/[\s-]/g, '');
        // Append +91 if missing
        if (!cleaned.startsWith('+')) {
            if (cleaned.length === 10) {
                cleaned = '+91' + cleaned;
            }
        }
        return cleaned;
    }
}
