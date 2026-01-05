import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../apps/web-client/src/environments/environment';

// Define interfaces locally or import from shared lib if available
export interface Location {
    id: number;
    name: string;
    slug: string;
    address?: string;
    tenant_id: number;
    default_form_id?: number;
}

export interface LocationCreate {
    name: string;
    slug: string;
    address?: string;
    default_form_id?: number;
}

@Injectable({
    providedIn: 'root'
})
export class TenantAdminService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/api/v1`;

    getLocations(): Observable<Location[]> {
        return this.http.get<Location[]>(`${this.apiUrl}/locations/`);
    }

    createLocation(payload: LocationCreate): Observable<Location> {
        return this.http.post<Location>(`${this.apiUrl}/locations/`, payload);
    }

    updateLocation(id: number, payload: Partial<LocationCreate>): Observable<Location> {
        return this.http.put<Location>(`${this.apiUrl}/locations/${id}`, payload);
    }

    getQrCodeImage(locationId: number, formSlug: string): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/locations/${locationId}/qr_image?form_slug=${formSlug}`, { responseType: 'blob' });
    }

    getTenant(): Observable<any> {
        return this.http.get(`${this.apiUrl}/tenants/me`);
    }

    updateTenant(payload: any): Observable<any> {
        return this.http.patch(`${this.apiUrl}/tenants/me`, payload);
    }

    uploadLetterhead(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post(`${this.apiUrl}/tenants/me/letterhead`, formData);
    }

    approveBranding(formData: FormData): Observable<any> {
        return this.http.post(`${this.apiUrl}/tenants/me/branding-approve`, formData);
    }

    // Form Management
    getForms(): Observable<Form[]> {
        return this.http.get<Form[]>(`${this.apiUrl}/forms/`);
    }

    getForm(id: number): Observable<Form> {
        return this.http.get<Form>(`${this.apiUrl}/forms/${id}`);
    }

    createForm(payload: FormCreate): Observable<Form> {
        return this.http.post<Form>(`${this.apiUrl}/forms/`, payload);
    }

    updateForm(id: number, payload: Partial<FormCreate>): Observable<Form> {
        return this.http.put<Form>(`${this.apiUrl}/forms/${id}`, payload);
    }

    setDefaultForm(id: number): Observable<Form> {
        return this.http.post<Form>(`${this.apiUrl}/forms/${id}/set_default`, {});
    }

    getFormStats(id: number, filters?: any): Observable<FormStats> {
        let params: any = {};
        if (filters) {
            if (filters.start_date) params.start_date = filters.start_date;
            if (filters.end_date) params.end_date = filters.end_date;
            if (filters.location_id) params.location_id = filters.location_id;
        }
        return this.http.get<FormStats>(`${this.apiUrl}/forms/${id}/stats`, { params });
    }

    exportFormCsv(id: number, filters?: any): Observable<Blob> {
        let params: any = {};
        if (filters) {
            if (filters.start_date) params.start_date = filters.start_date;
            if (filters.end_date) params.end_date = filters.end_date;
            if (filters.location_id) params.location_id = filters.location_id;
        }
        return this.http.get(`${this.apiUrl}/forms/${id}/export`, { params, responseType: 'blob' });
    }
}

// ...

export interface FormStats {
    total_responses: number;
    field_summaries: Record<string, { label: string, type: string, average?: number, count: number }>;
    recent_responses: any[];
}

export interface Form {
    id: number;
    title: string;
    slug: string;
    is_published: boolean;
    is_default: boolean;
    form_schema: any;
    tenant_id: number;
    created_at: string;
}

export interface FormCreate {
    title: string;
    slug: string;
    form_schema?: any;
    is_published?: boolean;
    is_default?: boolean;
}

