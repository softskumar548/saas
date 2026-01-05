import { Route } from '@angular/router';
import { FleeterLayoutComponent } from './layout/fleeter-layout.component';
import { FleeterOverviewComponent } from './pages/fleeter-overview.component';
import { FleeterLeadsComponent } from './pages/fleeter-leads.component';
import { FleeterOnboardingComponent } from './pages/fleeter-onboarding.component';
import { FleeterTenantsComponent } from './pages/fleeter-tenants.component';
import { FleeterFollowUpsComponent } from './pages/fleeter-follow-ups.component';
import { FleeterPerformanceComponent } from './pages/fleeter-performance.component';
import { FleeterProfileComponent } from './pages/fleeter-profile.component';

export const fleeterRoutes: Route[] = [
    {
        path: '',
        component: FleeterLayoutComponent,
        children: [
            { path: 'overview', component: FleeterOverviewComponent },
            { path: 'leads', component: FleeterLeadsComponent },
            { path: 'onboarding', component: FleeterOnboardingComponent },
            { path: 'tenants', component: FleeterTenantsComponent },
            { path: 'follow-ups', component: FleeterFollowUpsComponent },
            { path: 'performance', component: FleeterPerformanceComponent },
            { path: 'profile', component: FleeterProfileComponent },
            { path: '', redirectTo: 'overview', pathMatch: 'full' }
        ]
    }
];
