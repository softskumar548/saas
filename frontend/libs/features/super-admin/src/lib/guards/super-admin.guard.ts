import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '@features/auth';

export const SuperAdminGuard: CanActivateFn = () => {
    const router = inject(Router);
    const authService = inject(AuthService);
    const user = authService.user();

    if (user && user.role === 'super_admin') {
        return true;
    }

    // If logged in but not super admin, go to dashboard
    if (authService.isAuthenticated()) {
        router.navigate(['/dashboard']);
        return false;
    }

    // Not logged in
    router.navigate(['/login']);
    return false;
};
