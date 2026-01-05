export const environment = {
    production: true,
    // usage of relative path allows nginx to proxy it to the backend
    // In our docker-compose and render setup, we might need a full URL if they are on different domains.
    // BUT, for Render, they are two different services.
    // Ideally, we should inject this at runtime or build time.
    // For now, let's assume the user will have to manually update this or we use a clever specific URL.
    // Actually, on Render, the backend has its own URL.
    apiUrl: 'https://saas-backend-ckv1.onrender.com'
};
