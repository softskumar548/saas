import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api, PerformanceMetrics, getPerformanceMetricsApiV1FleeterPerformanceGet } from '@shared/api-client';

@Component({
  selector: 'lib-fleeter-performance',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-8 max-w-6xl mx-auto min-h-screen">
      <!-- Header -->
      <div class="mb-12">
        <h1 class="text-4xl font-black text-gray-900 uppercase tracking-tighter">Performance & Growth</h1>
        <p class="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Personal sales velocity and conversion metrics.</p>
      </div>

      <div *ngIf="loading()" class="py-20 text-center">
        <div class="animate-spin inline-block w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full mb-4"></div>
        <p class="text-gray-500 font-black uppercase text-xs tracking-widest">Compiling Stats...</p>
      </div>

      <div *ngIf="!loading() && metrics()" class="animate-in fade-in duration-700">
        <!-- Top Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div class="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm transition-all hover:shadow-xl group">
                <p class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex justify-between items-center">
                    Leads Converted
                    <span class="w-2 h-2 rounded-full bg-green-500"></span>
                </p>
                <div class="flex items-end gap-2">
                    <span class="text-5xl font-black text-gray-900 leading-none">{{ metrics()?.leads_converted }}</span>
                    <span class="text-gray-400 font-bold text-xs mb-1">/ {{ metrics()?.leads_total }}</span>
                </div>
                <div class="mt-6 flex flex-col gap-2">
                    <div class="flex justify-between text-[10px] font-black uppercase text-gray-400">
                        <span>Success Rate</span>
                        <span class="text-indigo-600">{{ metrics()?.conversion_rate }}%</span>
                    </div>
                    <div class="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                        <div class="h-full bg-indigo-600 transition-all duration-1000" [style.width.%]="metrics()?.conversion_rate"></div>
                    </div>
                </div>
            </div>

            <div class="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm transition-all hover:shadow-xl">
                <p class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Active Tenants</p>
                <div class="flex items-end gap-3">
                    <span class="text-5xl font-black text-gray-900 leading-none">{{ metrics()?.tenants_activated }}</span>
                    <span class="text-3xl text-indigo-200">🏢</span>
                </div>
                <p class="mt-6 text-xs font-bold text-gray-500 uppercase tracking-tight">Contributing to ARR</p>
            </div>

            <div class="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm transition-all hover:shadow-xl">
                <p class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Speed to Value</p>
                <div class="flex items-end gap-2">
                    <span class="text-5xl font-black text-gray-900 leading-none">{{ metrics()?.avg_onboarding_days }}</span>
                    <span class="text-gray-400 font-bold text-xs mb-1 uppercase tracking-widest">Days</span>
                </div>
                <p class="mt-6 text-xs font-bold text-gray-500 uppercase tracking-tight">Avg. Onboarding duration</p>
            </div>

            <div class="bg-white p-8 rounded-[40px] border border-indigo-100 shadow-xl shadow-indigo-50/50 bg-gradient-to-br from-indigo-50/20 to-transparent">
                <p class="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-4">Monthly Target</p>
                <div class="flex items-end gap-2 mb-6">
                    <span class="text-5xl font-black text-gray-900 leading-none">{{ (metrics()?.leads_converted || 0) }}</span>
                    <span class="text-gray-400 font-bold text-xs mb-1">/ {{ metrics()?.target_conversions }}</span>
                </div>
                <div class="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-center">
                    {{ getTargetStatus() }}
                </div>
            </div>
        </div>

        <!-- Monthly Trends -->
        <div class="bg-white rounded-[40px] border border-gray-100 shadow-sm p-12 mb-12">
            <h3 class="text-xl font-black text-gray-900 uppercase tracking-tighter mb-10">Monthly Conversion Trends</h3>
            
            <div class="flex items-end gap-1 lg:gap-4 h-64 w-full">
                <div *ngFor="let stat of metrics()?.monthly_stats" class="flex-1 flex flex-col items-center group">
                    <div class="relative w-full flex flex-col items-center justify-end h-48 mb-6">
                        <!-- Leads Bar (Light) -->
                        <div class="absolute bottom-0 w-8 lg:w-16 bg-gray-50 rounded-t-2xl transition-all duration-1000" 
                             [style.height.%]="(stat.leads / maxLeads()) * 100"></div>
                        <!-- Conversions Bar (Indigo) -->
                        <div class="absolute bottom-0 w-8 lg:w-16 bg-indigo-600 rounded-t-2xl transition-all duration-1000 hover:bg-indigo-700 cursor-pointer flex items-center justify-center" 
                             [style.height.%]="(stat.conversions / maxLeads()) * 100">
                             <span *ngIf="stat.conversions > 0" class="text-white text-[10px] font-black -rotate-90 lg:rotate-0 mb-2">{{ stat.conversions }}</span>
                        </div>
                    </div>
                    <span class="text-[9px] font-black uppercase tracking-widest text-gray-400 group-hover:text-indigo-600 transition-colors">{{ stat.month }}</span>
                </div>
            </div>
            <div class="mt-8 flex gap-6 justify-center">
                <div class="flex items-center gap-2">
                    <span class="w-3 h-3 rounded bg-gray-100"></span>
                    <span class="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Leads</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="w-3 h-3 rounded bg-indigo-600"></span>
                    <span class="text-[10px] font-black uppercase tracking-widest text-gray-400">Conversions</span>
                </div>
            </div>
        </div>

        <!-- Incentives / Badges -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-gray-900 rounded-[40px] p-10 text-white overflow-hidden relative">
                <div class="relative z-10">
                    <h3 class="text-2xl font-black uppercase tracking-tighter mb-4">Sales Excellence Badge</h3>
                    <p class="text-indigo-300 font-bold uppercase text-[10px] tracking-widest mb-10">Maintain > 20% conversion for 3 months</p>
                    
                    <div class="flex gap-4">
                        <div *ngFor="let i of [1,2,3]" 
                             [class]="'w-16 h-16 rounded-full flex items-center justify-center text-2xl border-2 ' + (i === 1 ? 'bg-indigo-500 border-indigo-400' : 'bg-gray-800 border-gray-700 opacity-50')">
                            🏆
                        </div>
                    </div>
                </div>
                <div class="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
            </div>

            <div class="bg-white rounded-[40px] border border-gray-100 shadow-sm p-10">
                <h3 class="text-xl font-black text-gray-900 uppercase tracking-tighter mb-6">Upcoming Milestones</h3>
                <div class="space-y-4">
                    <div class="p-4 rounded-3xl bg-gray-50 flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <span class="text-xl">🎓</span>
                            <div>
                                <p class="text-sm font-black text-gray-900 uppercase tracking-tight text-opacity-80">Tier 2 Representative</p>
                                <p class="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Connect 25 more tenants</p>
                            </div>
                        </div>
                        <span class="text-[10px] font-black text-indigo-600">60%</span>
                    </div>
                    <div class="p-4 rounded-3xl bg-gray-50 flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <span class="text-xl">✈️</span>
                            <div>
                                <p class="text-sm font-black text-gray-900 uppercase tracking-tight text-opacity-80">Annual Retreat Qualifier</p>
                                <p class="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Top 5 conversion rate</p>
                            </div>
                        </div>
                        <span class="text-[10px] font-black text-orange-500">Waitlist</span>
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
export class FleeterPerformanceComponent implements OnInit {
  private api = inject(Api);

  metrics = signal<PerformanceMetrics | null>(null);
  loading = signal(true);

  ngOnInit() {
    this.loadMetrics();
  }

  loadMetrics() {
    this.loading.set(true);
    this.api.invoke(getPerformanceMetricsApiV1FleeterPerformanceGet, {}).then((res: any) => {
      this.metrics.set(res);
      this.loading.set(false);
    });
  }

  maxLeads(): number {
    const stats = this.metrics()?.monthly_stats || [];
    if (stats.length === 0) return 10;
    return Math.max(...stats.map(s => s.leads), 10);
  }

  getTargetStatus(): string {
    const m = this.metrics();
    if (!m) return 'Tracking...';
    const progress = (m.leads_converted / (m.target_conversions || 15)) * 100;
    if (progress >= 100) return 'Target Achieved! 🚀';
    if (progress >= 75) return 'Almost There! 🔥';
    return `${Math.round(progress)}% of Target`;
  }
}
