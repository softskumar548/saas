import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { Api } from '@shared/api-client';
import { loginAccessTokenApiV1LoginAccessTokenPost } from '@shared/api-client';
import { BodyLoginAccessTokenApiV1LoginAccessTokenPost } from '@shared/api-client';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface User {
    id: number;
    email: string;
    full_name?: string;
    role: 'super_admin' | 'tenant_admin' | 'tenant_staff' | 'fleeter';
    tenant_id?: number;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private api = inject(Api);
    private router = inject(Router);
    private http = inject(HttpClient);

    // State
    private token = signal<string | null>(localStorage.getItem('access_token'));
    user = signal<User | null>(null);

    isAuthenticated = computed(() => !!this.token());

    constructor() {
        if (this.token()) {
            this.fetchProfile();
        }
    }

    login(credentials: BodyLoginAccessTokenApiV1LoginAccessTokenPost) {
        return this.api.invoke(loginAccessTokenApiV1LoginAccessTokenPost, { body: credentials }).then(async response => {
            this.setSession(response.access_token);
            await this.fetchProfile();
            return response;
        });
    }

    logout() {
        this.token.set(null);
        this.user.set(null);
        localStorage.removeItem('access_token');
        this.router.navigate(['/']);
    }

    private setSession(token: string) {
        this.token.set(token);
        localStorage.setItem('access_token', token);
    }

    getToken() {
        return this.token();
    }

    async fetchProfile() {
        try {
            const user = await firstValueFrom(this.http.get<User>('http://localhost:8000/api/v1/users/me'));
            this.user.set(user);
        } catch (e) {
            console.error('Failed to fetch user profile', e);
            // If fetch fails (e.g. 401), maybe logout?
            // For now just log it.
        }
    }
}
