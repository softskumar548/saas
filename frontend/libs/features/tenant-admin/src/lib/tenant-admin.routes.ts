import { Route } from '@angular/router';
import { TenantAdminLayoutComponent } from './layout/tenant-admin-layout.component';
import { SettingsComponent } from './settings/settings.component';
import { LocationListComponent } from './location-list/location-list.component';
import { LocationCreateComponent } from './location-create/location-create.component';
import { FormListComponent } from './form-list/form-list.component';
import { FormEditorComponent } from './form-editor/form-editor.component';
import { FormAnalyticsComponent } from './form-analytics/form-analytics.component';

export const tenantAdminRoutes: Route[] = [
    {
        path: '',
        component: TenantAdminLayoutComponent,
        children: [
            { path: 'dashboard', redirectTo: 'locations', pathMatch: 'full' },
            { path: 'settings', component: SettingsComponent },
            { path: 'locations', component: LocationListComponent },
            { path: 'locations/new', component: LocationCreateComponent },
            { path: 'forms', component: FormListComponent },
            { path: 'forms/new', component: FormEditorComponent },
            { path: 'forms/:id', component: FormEditorComponent },
            { path: 'forms/:id/analytics', component: FormAnalyticsComponent },
            { path: '', redirectTo: 'locations', pathMatch: 'full' }
        ]
    }
];
