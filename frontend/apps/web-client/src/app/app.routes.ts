import { Route } from '@angular/router';
import { LoginComponent } from '@features/auth';
import { FormViewerComponent } from '@features/public-form';
import { DashboardComponent } from './dashboard.component';
import { LandingComponent } from './landing/landing.component';

export const appRoutes: Route[] = [
    { path: 'login', component: LoginComponent },
    { path: 'dashboard', component: DashboardComponent },
    {
        path: 'tenant',
        loadChildren: () => import('@features/tenant-admin').then(m => m.tenantAdminRoutes)
    },
    {
        path: 'admin',
        loadChildren: () => import('@features/super-admin').then(m => m.superAdminRoutes)
    },
    {
        path: 'fleeter',
        loadChildren: () => import('@features/fleeter').then(m => m.fleeterRoutes)
    },
    { path: 'f/:slug', component: FormViewerComponent },
    { path: '', component: LandingComponent }
];
