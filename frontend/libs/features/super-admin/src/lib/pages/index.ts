import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';



@Component({
    selector: 'lib-sa-tenants',
    standalone: true,
    imports: [CommonModule],
    template: `<div class="p-8"><h1 class="text-3xl font-bold mb-4">Tenants</h1><p class="text-gray-600">Tenant list coming soon...</p></div>`
})
export class TenantListComponentPlaceHolder { }

export * from './user-list.component';

export * from './plans.component';

export * from './usage-metrics.component';

export * from './system-health.component';

export * from './feature-flags.component';

export * from './audit-logs.component';

export * from './settings.component';
export * from './overview.component';
