# CampusConnect Backend API

This backend handles server-side operations for the CampusConnect website:
- Contact form submissions (`/api/contact`)
- Event registrations (`/api/register`)
- View submitted data (`/api/data`)

## How to run locally:
```powershell
cd backend
node server.js
```
The API will start at: `http://localhost:5000/api`

## Zero dependencies:
Uses Node.js standard libraries so you don't even need to install third-party packages to get started. Data is saved to `backend/data.json`.
