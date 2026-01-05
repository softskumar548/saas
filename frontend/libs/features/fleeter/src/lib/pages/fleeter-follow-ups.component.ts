import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api, TaskWithContext, TaskStatus, TaskPriority, listTasksApiV1TasksGet, updateTaskApiV1TasksIdPatch, createTaskApiV1TasksPost, deleteTaskApiV1TasksIdDelete } from '@shared/api-client';

@Component({
  selector: 'lib-fleeter-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-8 max-w-5xl mx-auto min-h-screen">
      <!-- Header -->
      <div class="flex justify-between items-end mb-12">
        <div>
          <h1 class="text-4xl font-black text-gray-900 uppercase tracking-tighter">Tasks & Reminders</h1>
          <p class="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Zero-forget workflow for leads and tenants.</p>
        </div>
        <button (click)="openCreateModal()" class="px-8 py-4 bg-indigo-600 text-white rounded-[20px] text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95">
          + New Task
        </button>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div class="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-xl">🎯</div>
            <div>
                <p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Pending</p>
                <p class="text-2xl font-black text-gray-900">{{ stats().pending }}</p>
            </div>
        </div>
        <div class="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-xl">🔥</div>
            <div>
                <p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Overdue</p>
                <p class="text-2xl font-black text-red-600">{{ stats().overdue }}</p>
            </div>
        </div>
        <div class="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-xl">✅</div>
            <div>
                <p class="text-[10px] font-black uppercase tracking-widest text-gray-400">Completed Today</p>
                <p class="text-2xl font-black text-green-600">{{ stats().completedToday }}</p>
            </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading() && tasks().length === 0" class="py-20 text-center bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
        <div class="text-6xl mb-6">🏜️</div>
        <h3 class="text-2xl font-black text-gray-900 uppercase">All caught up</h3>
        <p class="text-gray-500 font-medium">No tasks assigned to you right now. Great job!</p>
      </div>

      <!-- Task List -->
      <div *ngIf="loading()" class="py-20 text-center">
         <div class="animate-spin inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-4"></div>
      </div>

      <div *ngIf="!loading()" class="space-y-4">
        <div *ngFor="let task of sortedTasks()" 
             [class]="'group bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm transition-all duration-300 flex items-center gap-6 ' + (task.status === 'completed' ? 'opacity-60 grayscale' : 'hover:shadow-xl hover:-translate-y-1')">
           
           <!-- Checkbox -->
           <button (click)="toggleTask(task)" 
                   [class]="'w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all ' + (task.status === 'completed' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-100 hover:border-indigo-400 text-transparent')">
                <span class="text-lg">✓</span>
           </button>

           <!-- Content -->
           <div class="flex-1">
             <div class="flex items-center gap-3 mb-1">
                <span [class]="'text-[10px] font-black uppercase tracking-widest ' + getPriorityColor(task.priority || 'medium')">
                   {{ task.priority }}
                </span>
                <span *ngIf="task.lead_name" class="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[9px] font-black uppercase tracking-tighter">
                   Lead: {{ task.lead_name }}
                </span>
                <span *ngIf="task.tenant_name" class="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-md text-[9px] font-black uppercase tracking-tighter">
                   Tenant: {{ task.tenant_name }}
                </span>
             </div>
             <h3 [class]="'text-lg font-black text-gray-900 transition-all ' + (task.status === 'completed' ? 'line-through' : '')">
                {{ task.title }}
             </h3>
             <div class="flex items-center gap-4 mt-2">
                <div [class]="'flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ' + getDateColor(task.due_date, task.status || 'pending')">
                   <span>📅 {{ task.due_date | date:'MMM d, h:mm a' }}</span>
                </div>
                <div *ngIf="task.notes" class="text-[10px] text-gray-400 font-medium truncate max-w-[200px]" [title]="task.notes">
                   💬 {{ task.notes }}
                </div>
             </div>
           </div>

           <!-- Delete -->
           <button (click)="deleteTask(task)" class="p-4 rounded-2xl hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
             🗑️
           </button>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <div *ngIf="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" (click)="closeModal()"></div>
      <div class="relative bg-white w-full max-w-lg rounded-[40px] shadow-2xl p-10 animate-in fade-in zoom-in duration-300 border border-white/20">
        <h2 class="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-8">Schedule Task</h2>
        
        <div class="space-y-6">
            <div>
                <label class="block text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-3 ml-1">Task Title</label>
                <input [(ngModel)]="newTask.title" placeholder="e.g. Call Acme Corp lead" 
                       class="w-full p-5 rounded-[20px] bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none font-bold text-gray-900">
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                   <label class="block text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-3 ml-1">Due Date</label>
                   <input type="datetime-local" [(ngModel)]="dueDateTime" 
                          class="w-full p-5 rounded-[20px] bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold text-gray-900">
                </div>
                <div>
                   <label class="block text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-3 ml-1">Priority</label>
                   <select [(ngModel)]="newTask.priority" 
                           class="w-full p-5 rounded-[20px] bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold text-gray-900 uppercase tracking-widest text-[10px]">
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                   </select>
                </div>
            </div>

            <div>
                <label class="block text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-3 ml-1">Notes (Optional)</label>
                <textarea [(ngModel)]="newTask.notes" rows="4" placeholder="Specific details or goals for this task..." 
                          class="w-full p-5 rounded-[24px] bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-medium text-gray-900"></textarea>
            </div>

            <div class="flex gap-4 pt-4">
                <button (click)="closeModal()" class="flex-1 py-4 bg-gray-50 text-gray-500 rounded-[20px] text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-all">Cancel</button>
                <button (click)="saveTask()" 
                        [disabled]="!newTask.title || !dueDateTime"
                        class="flex-[2] py-4 bg-indigo-600 text-white rounded-[20px] text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all disabled:opacity-50">
                   Schedule Task
                </button>
            </div>
        </div>
      </div>
    </div>
  `
})
export class FleeterFollowUpsComponent implements OnInit {
  private api = inject(Api);

  tasks = signal<TaskWithContext[]>([]);
  loading = signal(true);
  showModal = false;

  newTask: any = {
    title: '',
    priority: 'medium',
    notes: ''
  };
  dueDateTime = '';

  stats = signal({
    pending: 0,
    overdue: 0,
    completedToday: 0
  });

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.loading.set(true);
    this.api.invoke(listTasksApiV1TasksGet, {}).then((res: any) => {
      this.tasks.set(res);
      this.updateStats(res);
      this.loading.set(false);
    });
  }

  updateStats(items: TaskWithContext[]) {
    const now = new Date();
    const today = new Date().toDateString();

    this.stats.set({
      pending: items.filter(t => (t.status || '').toLowerCase() === 'pending').length,
      overdue: items.filter(t => (t.status || '').toLowerCase() === 'pending' && new Date(t.due_date) < now).length,
      completedToday: items.filter(t => (t.status || '').toLowerCase() === 'completed' && new Date(t.updated_at || t.created_at).toDateString() === today).length
    });
  }

  sortedTasks() {
    return [...this.tasks()].sort((a, b) => {
      const aStatus = (a.status || '').toLowerCase();
      const bStatus = (b.status || '').toLowerCase();
      if (aStatus === bStatus) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      return aStatus === 'pending' ? -1 : 1;
    });
  }

  toggleTask(task: TaskWithContext) {
    const newStatus = (task.status || '').toLowerCase() === 'pending' ? 'COMPLETED' : 'PENDING';
    this.api.invoke(updateTaskApiV1TasksIdPatch, {
      id: task.id,
      body: { status: newStatus as any }
    }).then(() => {
      this.loadTasks();
    });
  }

  deleteTask(task: TaskWithContext) {
    if (!confirm('Permanently delete this task?')) return;
    this.api.invoke(deleteTaskApiV1TasksIdDelete, { id: task.id }).then(() => {
      this.loadTasks();
    });
  }

  openCreateModal() {
    this.showModal = true;
    this.newTask = { title: '', priority: 'MEDIUM', notes: '' };
    this.dueDateTime = '';
  }

  closeModal() {
    this.showModal = false;
  }

  saveTask() {
    if (!this.newTask.title || !this.dueDateTime) return;

    this.api.invoke(createTaskApiV1TasksPost, {
      body: {
        ...this.newTask,
        due_date: new Date(this.dueDateTime).toISOString()
      }
    }).then(() => {
      this.closeModal();
      this.loadTasks();
    });
  }

  getPriorityColor(priority: string): string {
    switch ((priority || '').toLowerCase()) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-orange-500';
      default: return 'text-gray-400';
    }
  }

  getDateColor(date: string, status: string): string {
    if ((status || '').toLowerCase() === 'completed') return 'text-gray-300';
    const d = new Date(date);
    if (d < new Date()) return 'text-red-600';
    return 'text-gray-400';
  }
}
