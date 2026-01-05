import { Route } from '@angular/router';
import { SuperAdminLayoutComponent } from './layout/super-admin-layout.component';
import { SuperAdminGuard } from './guards/super-admin.guard';
import { OverviewComponent, PlansComponent, SystemHealthComponent, UserListComponent, UsageMetricsComponent, FeatureFlagsComponent, AuditLogsComponent, SettingsComponent } from './pages';
import { TenantListComponent } from './pages/tenant-list.component';

export const superAdminRoutes: Route[] = [
    {
        path: '',
        component: SuperAdminLayoutComponent,
        canActivate: [SuperAdminGuard],
        children: [
            { path: 'overview', component: OverviewComponent },
            { path: 'tenants', component: TenantListComponent },
            { path: 'tenants/new', loadComponent: () => import('./pages/tenant-create.component').then(m => m.TenantCreateComponent) },
            { path: 'users', component: UserListComponent },
            { path: 'plans', component: PlansComponent },
            { path: 'metrics', component: UsageMetricsComponent },
            { path: 'health', component: SystemHealthComponent },
            { path: 'feature-flags', component: FeatureFlagsComponent },
            { path: 'audit', component: AuditLogsComponent },
            { path: 'settings', component: SettingsComponent },
            { path: '', redirectTo: 'overview', pathMatch: 'full' }
        ]
    }
];
