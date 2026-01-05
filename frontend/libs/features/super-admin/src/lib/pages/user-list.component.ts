import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Api, User, UserRole, listUsersApiV1AdminUsersGet, createFleeterUserApiV1AdminUsersPost, toggleUserStatusApiV1AdminUsersUserIdStatusPost, resetPasswordActionApiV1AdminUsersUserIdPasswordResetPost } from '@shared/api-client';

@Component({
    selector: 'lib-sa-users',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
    <div class="p-8">
      <div class="flex justify-between items-center mb-8">
        <div>
           <h1 class="text-3xl font-bold text-gray-900">Users</h1>
           <p class="text-gray-500 mt-1">Manage platform access and staff.</p>
        </div>
        <button (click)="showCreateModal.set(true)" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium">
            + New Fleeter
        </button>
      </div>

      <!-- Filters -->
      <div class="mb-6 flex gap-4">
         <div class="relative flex-1">
             <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">🔍</span>
             <input type="text" [formControl]="searchControl" placeholder="Search by name or email..." class="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" />
         </div>
         <select [formControl]="roleFilterControl" class="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 bg-white">
            <option [ngValue]="null">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="fleeter">Fleeter (Sales)</option>
            <option value="tenant_admin">Tenant Admin</option>
            <option value="tenant_staff">Tenant Staff</option>
         </select>
      </div>

      <!-- User Table -->
      <div class="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr *ngFor="let user of users()" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div class="flex items-center gap-2">
                    <span>{{ user.id }}</span>
                    <button *ngIf="user.id" (click)="copyToClipboard(user.id.toString())" class="text-gray-400 hover:text-indigo-600 transition-colors" title="Copy ID">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </button>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 text-xs font-bold text-gray-600 border border-gray-200">
                        {{ user.full_name ? user.full_name[0] : user.email[0] }}
                    </div>
                    <div>
                        <div class="text-sm font-medium text-gray-900">{{ user.full_name || 'No Name' }}</div>
                        <div class="text-xs text-gray-500">{{ user.email }}</div>
                    </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" 
                      [ngClass]="{
                        'bg-purple-100 text-purple-800': user.role === 'super_admin',
                        'bg-blue-100 text-blue-800': user.role === 'fleeter',
                        'bg-green-100 text-green-800': user.role === 'tenant_admin',
                        'bg-gray-100 text-gray-800': user.role === 'tenant_staff'
                      }">
                  {{ user.role }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span *ngIf="user.is_active" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  Active
                </span>
                <span *ngIf="!user.is_active" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                  Disabled
                </span>
              </td>
               <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ user.last_login ? (user.last_login | date:'short') : 'Never' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button (click)="openResetPassword(user)" class="text-indigo-600 hover:text-indigo-900 mr-4">Reset Pwd</button>
                <button *ngIf="user.is_active" (click)="toggleStatus(user)" class="text-red-600 hover:text-red-900">Disable</button>
                <button *ngIf="!user.is_active" (click)="toggleStatus(user)" class="text-green-600 hover:text-green-900">Enable</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Create Fleeter Modal -->
      <div *ngIf="showCreateModal()" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
         <div class="bg-white rounded-xl shadow-xl p-8 w-full max-w-md animate-in fade-in zoom-in duration-200">
            <h2 class="text-2xl font-bold mb-6">Create Fleeter (Sales)</h2>
            <form [formGroup]="createForm" (ngSubmit)="createFleeter()">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Email</label>
                        <input formControlName="email" type="email" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 border">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Full Name</label>
                        <input formControlName="full_name" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 border">
                    </div>
                     <div>
                        <label class="block text-sm font-medium text-gray-700">Password</label>
                        <input formControlName="password" type="password" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 border">
                    </div>
                </div>
                <div class="mt-8 flex justify-end gap-3">
                    <button type="button" (click)="showCreateModal.set(false)" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                    <button type="submit" [disabled]="createForm.invalid || loading()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                        {{ loading() ? 'Creating...' : 'Create' }}
                    </button>
                </div>
            </form>
         </div>
      </div>

       <!-- Reset Password Modal -->
      <div *ngIf="selectedUserForReset()" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
         <div class="bg-white rounded-xl shadow-xl p-8 w-full max-w-md animate-in fade-in zoom-in duration-200">
            <h2 class="text-2xl font-bold mb-6">Reset Password</h2>
            <p class="mb-4 text-gray-600">Enter new password for {{ selectedUserForReset()?.email }}</p>
            <form [formGroup]="resetForm" (ngSubmit)="confirmResetPassword()">
                 <div>
                    <label class="block text-sm font-medium text-gray-700">New Password</label>
                    <input formControlName="password" type="password" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 border">
                </div>
                <div class="mt-8 flex justify-end gap-3">
                    <button type="button" (click)="selectedUserForReset.set(null)" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                    <button type="submit" [disabled]="resetForm.invalid || loading()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                        {{ loading() ? 'Resetting...' : 'Reset Password' }}
                    </button>
                </div>
            </form>
         </div>
      </div>

    </div>
  `
})
export class UserListComponent {
    private api = inject(Api);
    private fb = inject(FormBuilder);

    users = signal<User[]>([]);
    showCreateModal = signal(false);
    selectedUserForReset = signal<User | null>(null);
    loading = signal(false);

    searchControl = this.fb.control('');
    roleFilterControl = this.fb.control(null);

    createForm = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        full_name: ['', Validators.required],
        password: ['', [Validators.required, Validators.minLength(6)]]
    });

    resetForm = this.fb.group({
        password: ['', [Validators.required, Validators.minLength(6)]]
    });

    constructor() {
        this.loadUsers();

        // Simple reactivity for filters
        this.searchControl.valueChanges.subscribe(() => this.loadUsers());
        this.roleFilterControl.valueChanges.subscribe(() => this.loadUsers());
    }

    loadUsers() {
        this.api.invoke(listUsersApiV1AdminUsersGet, {
            search: this.searchControl.value || undefined,
            role: this.roleFilterControl.value || undefined
        }).then(res => {
            this.users.set(res);
        });
    }

    createFleeter() {
        if (this.createForm.invalid) return;
        this.loading.set(true);
        const val = this.createForm.value;

        this.api.invoke(createFleeterUserApiV1AdminUsersPost, {
            body: {
                email: val.email!,
                full_name: val.full_name!,
                password: val.password!,
                role: 'fleeter' as UserRole
            }
        }).then(() => {
            this.loading.set(false);
            this.showCreateModal.set(false);
            this.createForm.reset();
            this.loadUsers();
        }).catch(err => {
            console.error(err);
            this.loading.set(false);
            alert('Failed to create user. Email may be taken.');
        });
    }

    openResetPassword(user: User) {
        this.selectedUserForReset.set(user);
        this.resetForm.reset();
    }

    confirmResetPassword() {
        if (this.resetForm.invalid || !this.selectedUserForReset()) return;
        this.loading.set(true);

        this.api.invoke(resetPasswordActionApiV1AdminUsersUserIdPasswordResetPost, {
            user_id: this.selectedUserForReset()!.id as number,
            body: { password: this.resetForm.value.password! }
        }).then(() => {
            this.loading.set(false);
            this.selectedUserForReset.set(null);
            alert('Password reset successfully.');
        }).catch(err => {
            console.error(err);
            this.loading.set(false);
            alert('Failed to reset password.');
        });
    }

    toggleStatus(user: User) {
        if (!confirm(`Are you sure you want to ${user.is_active ? 'disable' : 'enable'} ${user.email}?`)) return;

        this.api.invoke(toggleUserStatusApiV1AdminUsersUserIdStatusPost, {
            user_id: user.id as number,
            is_active: !user.is_active
        }).then(() => {
            this.loadUsers();
        });
    }

    copyToClipboard(text: string) {
        navigator.clipboard.writeText(text).then(() => {
            // Valid copy
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    }
}
