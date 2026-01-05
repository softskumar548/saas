import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api, UserRead, PerformanceMetrics, readUserMeApiV1UsersMeGet, updateUserMeApiV1UsersMePatch, updatePasswordMeApiV1UsersMePasswordPost, getPerformanceMetricsApiV1FleeterPerformanceGet } from '@shared/api-client';

@Component({
  selector: 'lib-fleeter-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-8 max-w-4xl mx-auto min-h-screen">
      <div class="flex justify-between items-end mb-12">
        <div>
          <h1 class="text-4xl font-black text-gray-900 uppercase tracking-tighter">My Account</h1>
          <p class="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Manage your profile and security settings.</p>
        </div>
      </div>

      <div *ngIf="loading()" class="py-20 text-center">
        <div class="animate-spin inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full font-black mb-4"></div>
      </div>

      <div *ngIf="!loading()" class="space-y-12 animate-in fade-in duration-700">
        <!-- Overview Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-gray-900 rounded-[32px] p-6 text-white">
                <p class="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-4">Personal Velocity</p>
                <div class="text-3xl font-black">{{ metrics()?.conversion_rate }}%</div>
                <p class="text-[10px] text-gray-400 font-bold uppercase mt-1">Conversion Rate</p>
            </div>
            <div class="bg-indigo-600 rounded-[32px] p-6 text-white">
                <p class="text-[9px] font-black uppercase tracking-widest text-indigo-100 mb-4">Account Health</p>
                <div class="text-3xl font-black">{{ metrics()?.tenants_activated }}</div>
                <p class="text-[10px] text-indigo-200 font-bold uppercase mt-1">Active Tenants</p>
            </div>
            <div class="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm">
                <p class="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-4">Portfolio Size</p>
                <div class="text-3xl font-black text-gray-900">{{ metrics()?.leads_total }}</div>
                <p class="text-[10px] text-gray-400 font-bold uppercase mt-1">Total Leads Managed</p>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <!-- Profile Details -->
            <div class="space-y-8">
                <h2 class="text-xl font-black text-gray-900 uppercase tracking-tight">Identity & Contact</h2>
                
                <div class="space-y-6">
                    <div>
                        <label class="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-1">Full Name</label>
                        <input [(ngModel)]="profile.full_name" 
                               class="w-full p-5 rounded-[20px] bg-white border border-gray-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all outline-none font-bold text-gray-900 shadow-sm">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-1">Email Address</label>
                        <input [(ngModel)]="profile.email" type="email"
                               class="w-full p-5 rounded-[20px] bg-white border border-gray-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all outline-none font-bold text-gray-900 shadow-sm">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-1">Mobile Number</label>
                        <input [(ngModel)]="profile.mobile_number" 
                               class="w-full p-5 rounded-[20px] bg-white border border-gray-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all outline-none font-bold text-gray-900 shadow-sm">
                    </div>
                    
                    <button (click)="updateProfile()" class="w-full py-5 bg-gray-900 text-white rounded-[24px] text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-200">
                        Update Identity
                    </button>
                </div>
            </div>

            <!-- Security & Prefs -->
            <div class="space-y-12">
                <!-- Notifications -->
                <div class="space-y-6">
                    <h2 class="text-xl font-black text-gray-900 uppercase tracking-tight">Communication</h2>
                    <div class="space-y-3">
                        <label class="flex items-center justify-between p-5 rounded-[24px] bg-white border border-gray-100 shadow-sm cursor-pointer hover:bg-gray-50 transition-all group">
                             <div>
                                 <p class="text-sm font-black text-gray-900 uppercase tracking-tight">Email Notifications</p>
                                 <p class="text-[10px] text-gray-400 font-bold uppercase">Daily summaries and task alerts</p>
                             </div>
                             <div class="relative inline-flex items-center cursor-pointer">
                                 <input type="checkbox" [(ngModel)]="profile.email_notifications" class="sr-only peer" (change)="updateProfile()">
                                 <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                             </div>
                        </label>
                        <label class="flex items-center justify-between p-5 rounded-[24px] bg-white border border-gray-100 shadow-sm cursor-pointer hover:bg-gray-50 transition-all group">
                             <div>
                                 <p class="text-sm font-black text-gray-900 uppercase tracking-tight">Push Notifications</p>
                                 <p class="text-[10px] text-gray-400 font-bold uppercase">Real-time Lead alerts</p>
                             </div>
                             <div class="relative inline-flex items-center cursor-pointer">
                                 <input type="checkbox" [(ngModel)]="profile.push_notifications" class="sr-only peer" (change)="updateProfile()">
                                 <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                             </div>
                        </label>
                    </div>
                </div>

                <!-- Password -->
                <div class="p-10 rounded-[40px] bg-gray-50 border border-gray-100">
                    <h2 class="text-xl font-black text-gray-900 uppercase tracking-tight mb-8 text-center">Security Key</h2>
                    <div class="space-y-4">
                        <input type="password" [(ngModel)]="passwordForm.old" placeholder="Current Secret" 
                               class="w-full p-5 rounded-[20px] bg-white border-transparent focus:border-indigo-500 focus:ring-0 transition-all outline-none font-bold text-gray-900 text-center">
                        <input type="password" [(ngModel)]="passwordForm.new" placeholder="New Secret" 
                               class="w-full p-5 rounded-[20px] bg-white border-transparent focus:border-indigo-500 focus:ring-0 transition-all outline-none font-bold text-gray-900 text-center">
                        
                        <button (click)="changePassword()" class="w-full py-5 bg-white text-indigo-600 border border-indigo-100 rounded-[24px] text-xs font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">
                            Update Security Key
                        </button>
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
export class FleeterProfileComponent implements OnInit {
  private api = inject(Api);

  loading = signal(true);
  profile: any = {};
  metrics = signal<PerformanceMetrics | null>(null);

  passwordForm = {
    old: '',
    new: ''
  };

  ngOnInit() {
    this.initialLoad();
  }

  async initialLoad() {
    this.loading.set(true);
    try {
      const [user, perf] = await Promise.all([
        this.api.invoke(readUserMeApiV1UsersMeGet, {}),
        this.api.invoke(getPerformanceMetricsApiV1FleeterPerformanceGet, {})
      ]);
      this.profile = user;
      this.metrics.set(perf);
    } catch (err) {
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }

  updateProfile() {
    this.api.invoke(updateUserMeApiV1UsersMePatch, {
      body: {
        email: this.profile.email,
        full_name: this.profile.full_name,
        mobile_number: this.profile.mobile_number,
        email_notifications: this.profile.email_notifications,
        push_notifications: this.profile.push_notifications
      }
    }).then(() => {
      // Success toast or subtle feedback
    });
  }

  changePassword() {
    if (!this.passwordForm.old || !this.passwordForm.new) return;

    this.api.invoke(updatePasswordMeApiV1UsersMePasswordPost, {
      old_password: this.passwordForm.old,
      new_password: this.passwordForm.new
    }).then(res => {
      alert((res as any).message);
      this.passwordForm = { old: '', new: '' };
    }).catch(err => {
      alert(err.error?.detail || 'Failed to update password');
    });
  }
}
