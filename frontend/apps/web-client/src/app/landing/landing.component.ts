import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LoginComponent, AuthService } from '@features/auth';
import { environment } from '../../environments/environment';

interface Plan {
    id: number;
    name: string;
    price_monthly: number;
    max_forms: number;
    max_responses_per_month: number;
}

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [CommonModule, RouterModule, LoginComponent],
    templateUrl: './landing.component.html',
})
export class LandingComponent implements OnInit {
    private http = inject(HttpClient);
    authService = inject(AuthService);

    plans$: Observable<Plan[]>;
    showLogin = false;

    constructor() { // Converted to inject style for consistency
        this.plans$ = this.http.get<Plan[]>(`${environment.apiUrl}/api/v1/tenants/plans`).pipe(
            catchError(err => {
                console.error('Failed to fetch plans', err);
                return of([
                    { id: 1, name: 'Free', price_monthly: 0, max_forms: 1, max_responses_per_month: 100 },
                    { id: 2, name: 'Pro', price_monthly: 29, max_forms: 10, max_responses_per_month: 1000 }
                ]);
            })
        );
    }

    ngOnInit() { }

    openLogin() {
        console.log('Opening login modal...');
        this.showLogin = true;
    }

    logout() {
        this.authService.logout();
    }
}
