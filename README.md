# QR Feedback SaaS

A multi-tenant SaaS platform for QR code based feedback.

## Project Structure

This is a Monorepo containing both Backend and Frontend code.

### 1. Backend (`/backend`)
*   **Tech**: Python, FastAPI, SQLModel, PostgreSQL.
*   **Setup**:
    ```bash
    cd backend
    docker compose up -d --build
    ```
*   **Docs**: `http://localhost:8000/docs`

### 2. Frontend (`/frontend`)
*   **Tech**: Nx, Angular, Ionic, Tailwind.
*   **Apps**:
    *   `apps/web-client`: The main web portal for Clients and Super Admin.
    *   `apps/mobile-fleeter`: Ionic App for Sales Agents.
    *   `apps/mobile-client`: Ionic App for Clients.
*   **Setup**:
    ```bash
    cd frontend
    npm install
    npx nx serve web-client
    ```

## Development Workflow
1.  Start Backend (Docker).
2.  Start Frontend (Nx Serve).
3.  Go to `http://localhost:4200`.

## Key Commands
*   **Generate API Client**: Run `npm run generate-api` in `frontend` (After backend is running).
