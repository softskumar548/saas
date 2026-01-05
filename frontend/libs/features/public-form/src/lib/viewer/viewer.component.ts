import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Api } from '@shared/api-client';
import { getPublicFormApiV1FormsPublicSlugGet, submitFeedbackApiV1FormsPublicFeedbackPost } from '@shared/api-client';
import { ValuesCreate } from '@shared/api-client';

@Component({
  selector: 'lib-form-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="loading()" class="p-8 text-center text-gray-500">
      <div class="animate-pulse">Loading form...</div>
    </div>
    
    <div *ngIf="error()" class="p-8 text-center text-red-500">
      {{ error() }}
    </div>
    
    <div *ngIf="form()" class="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-500" 
        [style.font-family]="effectiveFontFamily()">
      
      <div class="max-w-3xl mx-auto">
        <!-- HEADER -->
        <div class="mb-6 relative flex items-start gap-4 border-b-2 pb-4" [style.borderColor]="effectivePrimaryColor()">
             <!-- Logo: Left Aligned, auto-sized -->
             <div *ngIf="form().tenant?.logo_url" class="shrink-0 pt-0.5">
                 <img [src]="getLogoUrl(form().tenant.logo_url)" class="h-10 w-auto object-contain">
             </div>

             <!-- Company Info: Left Aligned, tighter type -->
             <div class="flex-1">
                 <h1 class="text-xl font-bold capitalize tracking-tight mb-0.5 leading-none text-gray-900">
                     {{ form().tenant?.name || 'Organization Name' }}
                 </h1>
                 <p class="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-0.5">
                     {{ form().tenant?.tagline || 'Tag Line' }}
                 </p>
                 <p class="text-[10px] text-gray-500">
                     {{ form().tenant?.address || 'Headquarters Address' }}
                 </p>
             </div>
        </div>

        <!-- TITLE: Reduced margin below -->
        <div class="mb-6">
            <h2 class="text-lg font-bold capitalize tracking-tight text-gray-900">
                {{ form().title }}
            </h2>
            <p *ngIf="form().description" class="text-sm text-gray-500 mt-1">{{ form().description }}</p>
        </div>
        
        <!-- FORM CONTENT: Tighter vertical spacing -->
        <form class="space-y-4" (ngSubmit)="submit()" novalidate>
          <div *ngFor="let field of formFields">
            
            <!-- SECTION BREAK: Reduced Vertical Padding -->
            <div *ngIf="field.type === 'section'" class="pt-4 pb-2 mb-2 border-b border-gray-100">
                <h3 class="text-base font-bold capitalize text-gray-800">{{ field.label }}</h3>
                <p *ngIf="field.helpText" class="text-xs mt-0.5 text-gray-500">{{ field.helpText }}</p>
            </div>

            <!-- FIELDS -->
            <ng-container *ngIf="field.type !== 'section'">
                <div class="group">
                    <div class="mb-1">
                        <label class="block text-xs font-bold capitalize text-gray-600" 
                               [style.color]="isFieldInvalid(field) ? '#ef4444' : ''">
                          {{ field.label }}
                          <span *ngIf="field.required" class="text-red-500">*</span>
                        </label>
                        
                        <!-- VALIDATION: STRICTLY BELOW LABEL / ABOVE INPUT -->
                        <div *ngIf="isFieldInvalid(field)" class="mt-1 text-[10px] font-bold text-red-500 uppercase tracking-wider animate-pulse">
                            {{ getValidationMessage(field) }}
                        </div>
                    </div>
                    
                    <div [ngSwitch]="field.type">
                      <!-- Input: Filled Style -->
                      <div *ngSwitchCase="'input'">
                        <input type="text" [(ngModel)]="userAnswers[field.id]" [name]="field.id" [required]="field.required" [placeholder]="field.placeholder || ''"
                          class="block w-full border-0 border-b-2 border-gray-200 bg-gray-50 focus:bg-white focus:ring-0 text-gray-900 text-sm py-3 px-3 rounded-t-md transition-all placeholder-gray-400 font-medium"
                          [class.border-red-500]="isFieldInvalid(field)"
                          [class.focus:border-red-500]="isFieldInvalid(field)"
                          [style.focus-border-color]="effectivePrimaryColor()">
                      </div>
                      
                      <!-- Email: Filled Style -->
                      <div *ngSwitchCase="'email'">
                        <input type="email" [(ngModel)]="userAnswers[field.id]" [name]="field.id" [required]="field.required" [placeholder]="field.placeholder || 'example@email.com'"
                          class="block w-full border-0 border-b-2 border-gray-200 bg-gray-50 focus:bg-white focus:ring-0 text-gray-900 text-sm py-3 px-3 rounded-t-md transition-all placeholder-gray-400 font-medium"
                          [class.border-red-500]="isFieldInvalid(field)"
                          [class.focus:border-red-500]="isFieldInvalid(field)"
                          [style.focus-border-color]="effectivePrimaryColor()">
                      </div>

                      <!-- Phone: Filled Style -->
                      <div *ngSwitchCase="'phone'">
                        <input type="tel" [(ngModel)]="userAnswers[field.id]" [name]="field.id" [required]="field.required" [placeholder]="field.placeholder || '+1 (555) 000-0000'"
                          class="block w-full border-0 border-b-2 border-gray-200 bg-gray-50 focus:bg-white focus:ring-0 text-gray-900 text-sm py-3 px-3 rounded-t-md transition-all placeholder-gray-400 font-medium"
                          [class.border-red-500]="isFieldInvalid(field)"
                          [class.focus:border-red-500]="isFieldInvalid(field)"
                          [style.focus-border-color]="effectivePrimaryColor()">
                      </div>

                      <!-- Date: Filled Style -->
                      <div *ngSwitchCase="'date'">
                        <input type="date" [(ngModel)]="userAnswers[field.id]" [name]="field.id" [required]="field.required"
                          class="block w-full border-0 border-b-2 border-gray-200 bg-gray-50 focus:bg-white focus:ring-0 text-gray-900 text-sm py-3 px-3 rounded-t-md transition-all placeholder-gray-400 font-medium"
                          [class.border-red-500]="isFieldInvalid(field)"
                          [class.focus:border-red-500]="isFieldInvalid(field)"
                          [style.focus-border-color]="effectivePrimaryColor()">
                      </div>

                      <!-- File: Simple Upload Style -->
                      <div *ngSwitchCase="'file'">
                        <input type="file" [required]="field.required"
                          class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                          [style.color]="effectivePrimaryColor()">
                      </div>

                      <!-- Rating: Styled Blocks -->
                      <div *ngSwitchCase="'rating'" class="py-2">
                         <div class="flex gap-2">
                            <button type="button" *ngFor="let star of [1,2,3,4,5]" (click)="userAnswers[field.id] = star"
                              class="w-12 h-12 flex items-center justify-center text-xl rounded-lg border-2 transition-all hover:-translate-y-1"
                              [style.borderColor]="userAnswers[field.id] >= star ? effectiveAccentColor() : '#e5e7eb'"
                              [style.backgroundColor]="userAnswers[field.id] >= star ? effectiveAccentColor() : 'transparent'"
                              [style.color]="userAnswers[field.id] >= star ? 'white' : '#9ca3af'">
                              ★
                            </button>
                         </div>
                      </div>

                      <!-- Boolean: Segmented Control -->
                      <div *ngSwitchCase="'boolean'" class="flex pt-2">
                         <div class="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
                             <button type="button" (click)="userAnswers[field.id] = true"
                                class="px-8 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-all"
                                [style.backgroundColor]="userAnswers[field.id] === true ? 'white' : 'transparent'"
                                [style.color]="userAnswers[field.id] === true ? effectivePrimaryColor() : 'gray'"
                                [class.shadow-sm]="userAnswers[field.id] === true">
                                Yes
                             </button>
                             <button type="button" (click)="userAnswers[field.id] = false"
                                class="px-8 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-all"
                                [style.backgroundColor]="userAnswers[field.id] === false ? 'white' : 'transparent'"
                                [style.color]="userAnswers[field.id] === false ? effectivePrimaryColor() : 'gray'"
                                [class.shadow-sm]="userAnswers[field.id] === false">
                                No
                             </button>
                         </div>
                      </div>

                      <!-- Select: Filled Style -->
                      <div *ngSwitchCase="'select'">
                        <select [(ngModel)]="userAnswers[field.id]" [name]="field.id" [required]="field.required"
                          class="block w-full border-0 border-b-2 border-gray-200 bg-gray-50 focus:bg-white focus:ring-0 text-gray-900 text-sm py-3 px-3 rounded-t-md transition-all font-medium cursor-pointer"
                          [class.border-red-500]="isFieldInvalid(field)"
                          [style.focus-border-color]="effectivePrimaryColor()">
                          <option value="" disabled selected>-- Select Option --</option>
                          <option *ngFor="let opt of field.options" [value]="opt">{{ opt }}</option>
                        </select>
                      </div>

                      <!-- Text Area: Filled Style -->
                       <div *ngSwitchCase="'text'">
                         <textarea [(ngModel)]="userAnswers[field.id]" [name]="field.id" [required]="field.required" rows="4"
                            class="block w-full border-0 border-b-2 border-gray-200 bg-gray-50 focus:bg-white focus:ring-0 text-gray-900 text-sm py-3 px-3 rounded-t-md transition-all resize-none placeholder-gray-400 font-medium"
                            [class.border-red-500]="isFieldInvalid(field)"
                            [style.focus-border-color]="effectivePrimaryColor()"
                            [placeholder]="field.placeholder || 'Enter your detailed response...'"></textarea>
                       </div>

                       <!-- Checkbox: Card Style -->
                       <div *ngSwitchCase="'checkbox'" class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                           <label *ngFor="let opt of field.options" 
                                  class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all hover:bg-gray-50"
                                  [class.border-gray-200]="!userAnswers[field.id]?.includes(opt)"
                                  [style.borderColor]="userAnswers[field.id]?.includes(opt) ? effectivePrimaryColor() : ''"
                                  [style.backgroundColor]="userAnswers[field.id]?.includes(opt) ? '#f9fafb' : ''">
                               <input type="checkbox" [checked]="userAnswers[field.id]?.includes(opt)" (change)="toggleCheckbox(field.id, opt, $event)"
                                      class="h-4 w-4 border-gray-300 rounded text-indigo-600 focus:ring-0"
                                      [style.color]="effectivePrimaryColor()">
                               <span class="text-xs font-bold uppercase tracking-wide text-gray-700">{{ opt }}</span>
                           </label>
                       </div>
                    </div>
                </div>
            </ng-container>
          </div>

          <!-- SUBMIT -->
          <div class="pt-12">
              <button type="submit" [disabled]="submitting()"
                class="w-full py-4 text-white font-bold text-sm tracking-widest uppercase rounded shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                [style.backgroundColor]="effectivePrimaryColor()">
                <span *ngIf="submitting()">Processing...</span>
                <span *ngIf="!submitting()">{{ form().form_schema?.branding?.styling?.submit_text || 'Submit' }}</span>
              </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class FormViewerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(Api);

  form = signal<any>(null);
  loading = signal(true);
  error = signal('');
  submitting = signal(false);
  locationId: number | null = null;

  userAnswers: Record<string, any> = {};

  get formFields() {
    return this.form()?.form_schema?.fields || [];
  }

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug');
    const loc = this.route.snapshot.queryParamMap.get('loc');
    if (loc) {
      this.locationId = parseInt(loc, 10);
    }

    if (slug) {
      this.loadForm(slug);
    } else {
      this.error.set('No form code provided');
      this.loading.set(false);
    }
  }

  async loadForm(slug: string) {
    try {
      const result = await this.api.invoke(getPublicFormApiV1FormsPublicSlugGet, { slug });
      this.form.set(result);

      // Initialize checkbox fields as arrays
      for (const field of this.formFields) {
        if (field.type === 'checkbox' && !this.userAnswers[field.id]) {
          this.userAnswers[field.id] = [];
        }
      }
    } catch (e) {
      this.error.set('Form not found or is currently inactive.');
    } finally {
      this.loading.set(false);
    }
  }

  // Branding Resolution Logic
  effectivePrimaryColor(): string {
    const formBranding = this.form()?.form_schema?.branding?.styling?.primary_color_override;
    if (formBranding) return formBranding;

    const tenant = this.form()?.tenant;
    if (tenant?.is_branding_approved && tenant?.primary_color) {
      return tenant.primary_color;
    }

    return '#000000'; // Default Black for Letterhead
  }

  effectiveSecondaryColor(): string {
    const formBranding = this.form()?.form_schema?.branding?.styling?.secondary_color_override;
    if (formBranding) return formBranding;

    const tenant = this.form()?.tenant;
    if (tenant?.is_branding_approved && tenant?.secondary_color) {
      return tenant.secondary_color;
    }

    return '#6b7280'; // Default Gray-500
  }

  effectiveAccentColor(): string {
    const formBranding = this.form()?.form_schema?.branding?.styling?.accent_color_override;
    if (formBranding) return formBranding;

    const tenant = this.form()?.tenant;
    if (tenant?.is_branding_approved && tenant?.accent_color) {
      return tenant.accent_color;
    }

    return '#000000'; // Default Black
  }

  effectiveFontFamily(): string {
    const formFont = this.form()?.form_schema?.branding?.styling?.font_family_override;
    if (formFont) return formFont;

    const tenant = this.form()?.tenant;
    if (tenant?.is_branding_approved && tenant?.font_family) {
      return tenant.font_family;
    }

    return 'Inter'; // Default
  }

  toggleCheckbox(fieldId: string, option: string, event: any) {
    if (!this.userAnswers[fieldId]) {
      this.userAnswers[fieldId] = [];
    }

    if (event.target.checked) {
      this.userAnswers[fieldId].push(option);
    } else {
      const index = this.userAnswers[fieldId].indexOf(option);
      if (index > -1) {
        this.userAnswers[fieldId].splice(index, 1);
      }
    }
  }

  handleFileUpload(fieldId: string, event: any) {
    const file = event.target.files[0];
    if (file) {
      // For now, just store the file name
      // TODO: Implement actual file upload to backend storage
      this.userAnswers[fieldId] = { name: file.name, size: file.size };
    }
  }

  getLogoUrl(url: string | null | undefined) {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) {
      return `http://localhost:8000${url}`;
    }
    return url;
  }

  // VALIDATION HELPERS
  submittedState = false;

  isFieldInvalid(field: any): boolean {
    if (!this.submittedState) return false;

    if (field.required) {
      // Checkbox array check
      if (field.type === 'checkbox') {
        return !this.userAnswers[field.id] || this.userAnswers[field.id].length === 0;
      }
      // Boolean check
      if (field.type === 'boolean') {
        return this.userAnswers[field.id] === undefined || this.userAnswers[field.id] === null;
      }
      // General emptiness check
      return !this.userAnswers[field.id];
    }
    return false;
  }

  getValidationMessage(field: any): string {
    if (field.required) return 'This field is required';
    return '';
  }

  async submit() {
    this.submittedState = true;
    if (!this.form()) return;

    // Validate all fields
    let isValid = true;
    for (const field of this.formFields) {
      if (this.isFieldInvalid(field)) {
        isValid = false;
        // Scroll to first error? For now, we just flag it.
      }
    }

    if (!isValid) return;

    this.submitting.set(true);

    const payload: any = {
      form_id: this.form().id,
      data: this.userAnswers,
      location_id: this.locationId
    };

    try {
      await this.api.invoke(submitFeedbackApiV1FormsPublicFeedbackPost, { body: payload });
      alert('Thank you! Your feedback has been recorded.');
      this.userAnswers = {};
      this.submittedState = false; // Reset val state

      // Re-initialize checkbox fields
      for (const field of this.formFields) {
        if (field.type === 'checkbox') {
          this.userAnswers[field.id] = [];
        }
      }
    } catch (e) {
      console.error(e);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }
}
