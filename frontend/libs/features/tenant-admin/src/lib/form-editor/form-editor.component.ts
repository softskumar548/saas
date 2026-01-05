import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TenantAdminService, Form, FormCreate } from '../tenant-admin.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';

type FieldType = 'input' | 'text' | 'rating' | 'boolean' | 'email' | 'phone' | 'date' | 'select' | 'checkbox' | 'file';

interface FormField {
  id: string;
  label: string;
  type: FieldType | 'section';
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[]; // For select and checkbox
}

interface FormBranding {
  header: {
    show_logo: boolean;
    show_title: boolean;
    alignment: 'left' | 'center' | 'right';
    background_color?: string;
    text_color?: string;
  };
  footer: {
    enabled: boolean;
    text: string;
    background_color?: string;
    text_color?: string;
  };
  watermark: {
    enabled: boolean;
    text: string;
    opacity: number;
  };
  styling: {
    primary_color_override?: string;
    font_family_override?: string;
    border_radius?: string;
    input_style?: 'standard' | 'filled' | 'underlined';
    submit_text?: string;
  };
}

interface FormSchema {
  fields: FormField[];
  branding: FormBranding;
}

@Component({
  selector: 'lib-form-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DragDropModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-7xl mx-auto px-4">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">{{ isEditMode ? 'Edit Form' : 'Create Form' }}</h1>
            <p class="text-sm text-gray-500 mt-1">Design your feedback form with drag-and-drop</p>
          </div>
          <div class="space-x-2">
            <button (click)="save()" [disabled]="saving()" 
                    class="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium shadow-sm transition-all">
                {{ saving() ? 'Saving...' : 'Save Form' }}
            </button>
            <button routerLink="/tenant/forms" 
                    class="bg-white text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-50 font-medium border border-gray-300 shadow-sm transition-all">
                Cancel
            </button>
          </div>
        </div>

        <!-- 3-Column Layout -->
        <div class="grid grid-cols-12 gap-6">
          <!-- Left: Settings (3 cols) -->
          <div class="col-span-3 space-y-4">
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-4">
              <h3 class="font-bold text-gray-900 mb-4 flex items-center">
                <svg class="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                General Settings
              </h3>
              
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Form Title</label>
                  <input [(ngModel)]="model.title" (ngModelChange)="onTitleChange()" type="text" 
                         placeholder="e.g. Customer Feedback Survey"
                         class="w-full rounded-lg border-gray-300 shadow-sm border p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">URL Slug</label>
                  <div class="flex rounded-lg shadow-sm">
                    <span class="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-600 text-sm font-mono">/f/</span>
                    <input [(ngModel)]="model.slug" type="text" 
                           class="flex-1 min-w-0 block w-full px-3 py-2.5 rounded-r-lg border-gray-300 border text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1.5">Button Text</label>
                  <input [(ngModel)]="model.form_schema.branding.styling.submit_text" type="text" 
                         placeholder="Submit"
                         class="w-full rounded-lg border-gray-300 shadow-sm border p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                </div>
                
                <div class="pt-2">
                  <label class="flex items-center cursor-pointer group">
                    <input [(ngModel)]="model.is_published" type="checkbox" 
                           class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
                    <span class="ml-2.5 text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">Published</span>
                  </label>
                </div>
              </div>
            </div>
            
          </div>

          <!-- Middle: Builder or Appearance (5 cols) -->
          <div class="col-span-5">
            <!-- BUILDER -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div class="flex justify-between items-center mb-5">
                <h3 class="font-bold text-gray-900 flex items-center">
                  <svg class="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
                  </svg>
                  Field Designer
                </h3>
                <div class="relative">
                  <button (click)="toggleFieldMenu()" 
                          class="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium shadow-sm transition-all flex items-center">
                    <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    New Field
                  </button>
                  <div *ngIf="showFieldMenu" class="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-10 py-2 overscroll-contain max-h-[400px] overflow-y-auto">
                    <button *ngFor="let ft of fieldTypes" (click)="addField(ft.type)" 
                            class="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center transition-colors">
                      <span [innerHTML]="ft.icon" class="w-5 h-5 mr-3 text-gray-600"></span>
                      <div class="flex-1">
                        <div class="text-sm font-medium text-gray-900">{{ ft.label }}</div>
                        <div class="text-xs text-gray-500">{{ ft.description }}</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <div cdkDropList (cdkDropListDropped)="drop($event)" class="space-y-3">
                <div *ngFor="let field of fields; let i = index" cdkDrag
                     class="border-2 border-gray-100 rounded-2xl p-4 bg-white hover:border-indigo-300 transition-all group relative">
                  
                  <div cdkDragHandle class="absolute left-2 top-4 cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg class="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"></path>
                    </svg>
                  </div>

                  <button (click)="removeField(i)" class="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>

                  <div class="pl-8">
                    <div class="grid grid-cols-12 gap-3 mb-3" *ngIf="field.type !== 'section'">
                      <div class="col-span-12">
                        <input [(ngModel)]="field.label" placeholder="Question Label" 
                               class="w-full font-bold text-gray-900 border-0 focus:ring-0 p-0 text-base placeholder-gray-300">
                      </div>
                    </div>
                    
                    <div *ngIf="field.type === 'section'" class="border-l-4 border-indigo-500 pl-3">
                        <input [(ngModel)]="field.label" placeholder="Section Title" 
                               class="w-full font-black text-xl text-indigo-900 border-0 focus:ring-0 p-0 placeholder-indigo-200">
                        <input [(ngModel)]="field.helpText" placeholder="Section subtitle or description..." 
                               class="w-full text-sm text-indigo-400 border-0 focus:ring-0 p-0 mt-1 placeholder-indigo-100 bg-transparent">
                    </div>

                    <div class="mt-3 grid grid-cols-2 gap-4" *ngIf="field.type !== 'section'">
                        <div class="space-y-1">
                            <label class="text-[10px] font-bold text-gray-400 uppercase">Field Type</label>
                            <select [(ngModel)]="field.type" 
                                    class="w-full rounded-lg border-gray-200 border p-1.5 text-xs bg-gray-50 focus:bg-white transition-colors">
                              <option *ngFor="let ft of fieldTypes" [value]="ft.type">{{ ft.label }}</option>
                            </select>
                        </div>
                        <div class="flex items-center justify-end">
                            <label class="flex items-center cursor-pointer">
                              <input type="checkbox" [(ngModel)]="field.required" class="h-4 w-4 text-indigo-600 border-gray-300 rounded">
                              <span class="ml-2 text-xs font-bold text-gray-500 uppercase">Required</span>
                            </label>
                        </div>
                    </div>
                    
                    <!-- Dynamic Options -->
                    <div *ngIf="field.type === 'select' || field.type === 'checkbox'" class="mt-4 bg-gray-50 p-3 rounded-xl">
                        <div class="space-y-2">
                           <div *ngFor="let opt of field.options; let oi = index" class="flex items-center gap-2">
                             <input [(ngModel)]="field.options![oi]" class="flex-1 rounded-lg border-gray-200 border p-1.5 text-xs bg-white">
                             <button (click)="removeOption(field, oi)" class="text-gray-300 hover:text-red-500"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                           </div>
                           <button (click)="addOption(field)" class="text-xs font-bold text-indigo-600 uppercase hover:underline">+ Add Choice</button>
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right: Live Preview (4 cols) -->
          <div class="col-span-4">
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-4 overflow-hidden">
              <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 class="font-bold text-gray-900 flex items-center text-sm">
                  <svg class="w-4 h-4 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                  Live Preview
                </h3>
                <span class="text-[10px] font-bold text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded">Mobile-First</span>
              </div>
              
              <!-- Preview Frame -->
              <div class="p-4 bg-gray-100 min-h-[500px] flex justify-center">
                <!-- Mock Mobile Screen (Scaled Down Letterhead) -->
                <div class="w-full max-w-[375px] bg-white shadow-2xl rounded-[2px] border border-gray-100 overflow-hidden flex flex-col relative"
                     [style.font-family]="model.form_schema.branding.styling.font_family_override">
                  
                  <!-- Watermark Overlay -->
                  <div *ngIf="model.form_schema.branding.watermark.enabled" 
                       class="absolute inset-0 pointer-events-none flex items-center justify-center rotate-[-30deg] z-50 select-none"
                       [style.opacity]="model.form_schema.branding.watermark.opacity">
                    <span class="text-4xl font-black text-gray-900 whitespace-nowrap">{{ model.form_schema.branding.watermark.text }}</span>
                  </div>

                  <div class="p-6 md:p-8 flex-1 overflow-y-auto custom-scrollbar">
                      <!-- HEADER -->
                      <div class="mb-6 relative flex items-start gap-4 border-b-2 pb-4" [style.borderColor]="model.form_schema.branding.styling.primary_color_override">
                          <!-- Logo -->
                          <div *ngIf="model.form_schema.branding.header.show_logo && tenantLogoUrl" class="shrink-0">
                              <img [src]="getLogoUrl(tenantLogoUrl)" class="h-10 w-auto object-contain">
                          </div>

                          <div class="flex-1 pt-0.5">
                              <h1 class="text-sm font-bold capitalize tracking-tight mb-0.5 leading-tight text-gray-900">
                                  Your Organization
                              </h1>
                              <p class="text-[8px] font-semibold capitalize tracking-wide text-gray-600 mb-0.5">
                                  My Tag Line
                              </p>
                              <p class="text-[6px] text-gray-500">
                                  Official Headquarters Address
                              </p>
                          </div>
                      </div>

                      <!-- TITLE -->
                      <div class="mb-4 text-center">
                          <h2 class="text-xs font-bold capitalize tracking-tight text-gray-900 decoration-solid underline-offset-2">
                              {{ model.title || 'Untitled Form' }}
                          </h2>
                      </div>
                      
                      <!-- FORM CONTENT -->
                      <div class="space-y-3">
                        <div *ngFor="let field of fields" class="animate-in fade-in slide-in-from-bottom-2 duration-300">
                          
                          <!-- SECTION BREAK -->
                          <div *ngIf="field.type === 'section'" class="pt-2 pb-1 mb-2 border-b border-gray-100">
                              <h3 class="text-xs font-bold capitalize text-gray-800">{{ field.label }}</h3>
                              <p *ngIf="field.helpText" class="text-[8px] mt-0.5 text-gray-400">{{ field.helpText }}</p>
                          </div>

                          <!-- FIELDS -->
                          <div *ngIf="field.type !== 'section'" class="flex flex-col gap-1">
                            <label class="block text-[10px] font-bold capitalize text-gray-600 group relative">
                              {{ field.label }}
                              <span *ngIf="field.required" class="ml-0.5 text-red-500">*</span>
                              <!-- VALIDATION PLACEHOLDER -->
                              <div class="hidden group-hover:block absolute left-0 top-full text-[8px] font-bold text-red-500 uppercase tracking-wider bg-white z-10">
                                  Field is required
                              </div>
                            </label>
                            
                            <div [ngSwitch]="field.type" class="mt-0.5">
                               <input *ngSwitchCase="'input'" type="text" [placeholder]="field.placeholder" 
                                     class="block w-full border-0 border-b-2 border-gray-200 bg-gray-50 text-xs px-3 py-2 rounded-t font-medium placeholder-gray-400" 
                                     [style.borderColor]="model.form_schema.branding.styling.primary_color_override" disabled>

                               <input *ngSwitchCase="'email'" type="email" [placeholder]="field.placeholder || 'email@example.com'" 
                                     class="block w-full border-0 border-b-2 border-gray-200 bg-gray-50 text-xs px-3 py-2 rounded-t font-medium placeholder-gray-400" 
                                     [style.borderColor]="model.form_schema.branding.styling.primary_color_override" disabled>
                               
                               <input *ngSwitchCase="'phone'" type="tel" [placeholder]="field.placeholder || '+1 555 000 0000'" 
                                     class="block w-full border-0 border-b-2 border-gray-200 bg-gray-50 text-xs px-3 py-2 rounded-t font-medium placeholder-gray-400" 
                                     [style.borderColor]="model.form_schema.branding.styling.primary_color_override" disabled>

                               <input *ngSwitchCase="'date'" type="date"
                                     class="block w-full border-0 border-b-2 border-gray-200 bg-gray-50 text-xs px-3 py-2 rounded-t font-medium placeholder-gray-400" 
                                     [style.borderColor]="model.form_schema.branding.styling.primary_color_override" disabled>

                               <div *ngSwitchCase="'file'" class="block w-full border-0 border-b-2 border-gray-200 bg-gray-50 text-xs px-3 py-2 rounded-t font-medium text-gray-400"
                                    [style.borderColor]="model.form_schema.branding.styling.primary_color_override">
                                   Choose file...
                               </div>
                              
                              <textarea *ngSwitchCase="'text'" class="block w-full border-0 border-b-2 border-gray-200 bg-gray-50 text-xs px-3 py-2 rounded-t font-medium" rows="2" disabled></textarea>
                              
                              <div *ngSwitchCase="'rating'" class="flex gap-1 py-1">
                                <span *ngFor="let s of [1,2,3,4,5]" class="w-8 h-8 rounded border flex items-center justify-center text-gray-300 bg-white">★</span>
                              </div>
                              
                              <div *ngSwitchCase="'boolean'" class="flex pt-1">
                                 <div class="inline-flex rounded border border-gray-200 p-0.5 bg-gray-50">
                                   <div class="px-3 py-1 bg-white shadow-sm text-[8px] font-bold uppercase tracking-widest text-gray-800 rounded">Yes</div>
                                   <div class="px-3 py-1 text-[8px] font-bold uppercase tracking-widest text-gray-400">No</div>
                                 </div>
                              </div>
                              
                              <div *ngSwitchCase="'select'" class="block w-full border-0 border-b-2 border-gray-200 bg-gray-50 text-xs px-3 py-2 rounded-t font-medium text-gray-400">-- Select --</div>
                              
                              <div *ngSwitchCase="'checkbox'" class="grid grid-cols-2 gap-2 pt-1">
                                <div *ngFor="let o of field.options | slice:0:2" class="flex items-center gap-2 p-2 border border-gray-200 rounded bg-white">
                                  <div class="w-3 h-3 border border-gray-300 rounded"></div>
                                  <span class="text-[8px] text-gray-600 uppercase font-bold">{{ o }}</span>
                                </div>
                              </div>
                              
                              <!-- Default -->
                              <input *ngSwitchDefault type="text" class="block w-full border-0 border-b-2 border-gray-200 bg-gray-50 text-xs px-3 py-2 rounded-t" disabled>
                            </div>
                          </div>
                        </div>
                        
                        <!-- Submit Button Preview -->
                        <div class="pt-6 flex justify-end">
                            <button class="px-6 py-3 text-white font-black text-[10px] tracking-[0.2em] uppercase shadow-lg"
                                    [style.backgroundColor]="model.form_schema.branding.styling.primary_color_override">
                              {{ model.form_schema.branding.styling.submit_text || 'Submit' }}
                            </button>
                        </div>
                      </div>

                      <!-- Footer -->
                      <div *ngIf="model.form_schema.branding.footer.enabled" 
                           class="mt-8 pt-4 border-t border-gray-100 text-[8px] text-center text-gray-400 leading-relaxed">
                        {{ model.form_schema.branding.footer.text }}
                      </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class FormEditorComponent implements OnInit {
  private service = inject(TenantAdminService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isEditMode = false;
  formId: number | null = null;
  saving = signal(false);
  showFieldMenu = false;



  defaultBranding: FormBranding = {
    header: {
      show_logo: true,
      show_title: true,
      alignment: 'center',
      background_color: '#ffffff',
      text_color: '#111827'
    },
    footer: {
      enabled: true,
      text: '© 2026 Your Organization. All rights reserved.',
      background_color: '#f9fafb',
      text_color: '#6b7280'
    },
    watermark: {
      enabled: false,
      text: 'CONFIDENTIAL',
      opacity: 0.05
    },
    styling: {
      primary_color_override: '#4F46E5',
      font_family_override: 'Inter',
      border_radius: '12px',
      input_style: 'standard',
      submit_text: 'Submit'
    }
  };

  model: FormCreate = {
    title: '',
    slug: '',
    is_published: false,
    is_default: false,
    form_schema: {
      fields: [],
      branding: { ...this.defaultBranding }
    }
  };

  fields: FormField[] = [];

  fieldTypes = [
    { type: 'input' as FieldType, label: 'Short Text', description: 'Single line text input', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8M4 18h16"></path></svg>' },
    { type: 'text' as FieldType, label: 'Text Area', description: 'Long-form text input', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>' },
    { type: 'email' as FieldType, label: 'Email', description: 'Email address field', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>' },
    { type: 'phone' as FieldType, label: 'Phone', description: 'Phone number input', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>' },
    { type: 'date' as FieldType, label: 'Date', description: 'Date picker', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>' },
    { type: 'rating' as FieldType, label: 'Star Rating', description: '5-star rating scale', icon: '<svg fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>' },
    { type: 'boolean' as FieldType, label: 'Yes/No', description: 'Binary choice', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>' },
    { type: 'select' as FieldType, label: 'Dropdown', description: 'Single choice dropdown', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>' },
    { type: 'checkbox' as FieldType, label: 'Checkboxes', description: 'Multiple choice', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>' },
    { type: 'file' as FieldType, label: 'File Upload', description: 'File attachment', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>' },
    { type: 'section' as any, label: 'Section Break', description: 'Title and divider', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 13l-7 7-7-7m14-8l-7 7-7-7"></path></svg>' }
  ];

  tenantLogoUrl: string | null = null;

  ngOnInit() {
    // Fetch tenant branding details for the preview
    this.service.getTenant().subscribe(tenant => {
      if (tenant && tenant.logo_url) {
        this.tenantLogoUrl = tenant.logo_url;
      }
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.formId = parseInt(id, 10);
      this.loadForm(this.formId);
    } else {
      this.model.title = 'New Feedback Form';
      this.model.slug = 'form-' + Math.random().toString(36).substring(7);
    }

    // Close menu on outside click
    document.addEventListener('click', (e) => {
      if (!(e.target as HTMLElement).closest('.relative')) {
        this.showFieldMenu = false;
      }
    });
  }

  getLogoUrl(url: string | null | undefined) {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) {
      return `http://localhost:8000${url}`;
    }
    return url;
  }

  loadForm(id: number) {
    this.service.getForm(id).subscribe(form => {
      let schema = form.form_schema;
      if (typeof schema === 'string') {
        try {
          schema = JSON.parse(schema);
        } catch (e) {
          console.error('Failed to parse form_schema', e);
          schema = { fields: [], branding: { ...this.defaultBranding } };
        }
      }

      this.model = {
        title: form.title,
        slug: form.slug,
        is_published: form.is_published,
        is_default: form.is_default,
        form_schema: schema || { fields: [], branding: { ...this.defaultBranding } }
      };

      if (this.model.form_schema?.fields) {
        this.fields = this.model.form_schema.fields;
      }

      // Ensure branding defaults are merged if missing
      this.model.form_schema.branding = {
        ...this.defaultBranding,
        ...(this.model.form_schema.branding || {})
      };
    });
  }

  onTitleChange() {
    if (!this.isEditMode) {
      // Auto-generate slug from title
      this.model.slug = this.model.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }
  }

  toggleFieldMenu() {
    this.showFieldMenu = !this.showFieldMenu;
  }

  addField(type: FieldType | 'section') {
    const id = 'field_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newField: FormField = {
      id,
      label: type === 'section' ? 'New Section' : 'New Question',
      type,
      required: false,
      placeholder: '',
      helpText: ''
    };

    if (type === 'select' || type === 'checkbox') {
      newField.options = ['Option 1', 'Option 2', 'Option 3'];
    }

    this.fields.push(newField);
    this.showFieldMenu = false;
  }

  removeField(index: number) {
    if (confirm('Remove this field?')) {
      this.fields.splice(index, 1);
    }
  }

  addOption(field: FormField) {
    if (!field.options) field.options = [];
    field.options.push('New Option');
  }

  removeOption(field: FormField, index: number) {
    field.options?.splice(index, 1);
  }

  drop(event: CdkDragDrop<FormField[]>) {
    moveItemInArray(this.fields, event.previousIndex, event.currentIndex);
  }

  save() {
    this.saving.set(true);

    this.model.form_schema = {
      fields: this.fields,
      branding: this.model.form_schema.branding
    };

    if (this.isEditMode && this.formId) {
      this.service.updateForm(this.formId, this.model).subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/tenant/forms']);
        },
        error: (err) => {
          console.error(err);
          this.saving.set(false);
          alert('Failed to update form.');
        }
      });
    } else {
      this.service.createForm(this.model).subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/tenant/forms']);
        },
        error: (err) => {
          console.error(err);
          this.saving.set(false);
          alert('Failed to create form. Slug might be taken.');
        }
      });
    }
  }
}
