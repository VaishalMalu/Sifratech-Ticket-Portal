# Sifratech Ticket Portal

## Overview

The Sifratech Ticket Portal is a comprehensive, enterprise-grade Help Desk and IT Service Management (ITSM) system designed to streamline communication between clients and support teams. The portal provides an intuitive interface for clients to raise issues, and a robust backend for engineers and managers to track, assign, and resolve tickets while adhering to Service Level Agreements (SLAs).

The system is built as a modern, decoupled web application featuring a React-based frontend and an Express/Node.js backend, powered by a Supabase PostgreSQL database.

## Architecture

The project is structured as a monorepo containing both the frontend and backend applications:

- **sifratech-portal-react**: The frontend user interface built with React, Vite, and modern CSS practices.
- **sifratech-backend**: The backend REST API server built with Node.js and Express, handling scheduled jobs, email notifications, and integrations.
- **Database**: Supabase PostgreSQL with Row Level Security (RLS) for robust data access control and real-time event broadcasting.

## Key Features

- **Role-Based Access Control (RBAC)**: Distinct interfaces and permissions for Customers, Support Engineers, Managers, and Administrators.
- **Client Segregation**: Multi-tenant architecture ensuring clients only have access to their respective organizational data.
- **SLA Management**: Automated Service Level Agreement tracking with dynamic breach calculations based on ticket priority.
- **Real-time Synchronization**: Live updates to the ticket dashboard utilizing PostgreSQL replication and Supabase Realtime channels.
- **Automated Email Notifications**: SMTP-based email dispatch for critical events (Ticket Creation, Assignment, Resolution, and Escalation).
- **AI-Powered Insights**: Integrated AI features for ticket sentiment analysis, urgency detection, and automated resolution reply suggestions.
- **Secure File Attachments**: Cloud-based object storage for secure uploading and sharing of diagnostic files, logs, and screenshots.

## Technical Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router DOM v6
- **State Management & Authentication**: React Context API, Supabase Auth
- **Styling**: Pure CSS with responsive design principles

### Backend
- **Runtime**: Node.js
- **Server Framework**: Express.js
- **Database**: PostgreSQL (hosted on Supabase)
- **Integrations**: Azure MSAL (Microsoft Graph API for Emails), Google Generative AI

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- NPM or Yarn package manager
- A Supabase Project (Database, Auth, and Storage)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/VaishalMalu/Sifratech-Ticket-Portal.git
   cd Sifratech-Ticket-Portal
   ```

2. **Frontend Setup**
   Navigate to the frontend directory and install dependencies:
   ```bash
   cd sifratech-portal-react
   npm install
   ```

3. **Backend Setup**
   Navigate to the backend directory and install dependencies:
   ```bash
   cd ../sifratech-backend
   npm install
   ```

### Environment Configuration

Before running the application, you must configure the environment variables. 
Create a `.env` file in both the frontend and backend directories based on the required configurations.

**Frontend (`sifratech-portal-react/.env`)**
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BACKEND_URL=http://localhost:3000
```

**Backend (`sifratech-backend/.env`)**
```env
PORT=3000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
# Additional variables for Email Providers and AI Services as required by the backend
```

### Running the Application Locally

To start the development environment, you will need to run both servers concurrently.

**Start the Backend Server:**
```bash
cd sifratech-backend
npm run start
```
The backend API will be available at `http://localhost:3000`.

**Start the Frontend Application:**
```bash
cd sifratech-portal-react
npm run dev
```
The web portal will be accessible at `http://localhost:5173`.

## Deployment

The application is designed to be cloud-native and can be deployed to standard platform-as-a-service (PaaS) providers.

- **Frontend**: Can be statically built (`npm run build`) and hosted on platforms like Vercel, Netlify, or Azure Static Web Apps.
- **Backend**: Can be containerized or hosted directly on platforms like Heroku, Render, or Azure App Service. Ensure environment variables are securely injected via the hosting provider's configuration panel.

## Security and Privacy

- **Authentication**: Managed via Supabase Auth (JWT-based).
- **Authorization**: Row Level Security (RLS) is strictly enforced on the PostgreSQL database to prevent unauthorized data access across tenants.
- **Sensitive Data**: Environment variables, raw database dumps, and internal knowledge base files are strictly excluded from version control via `.gitignore`. 

## Support

For technical inquiries or deployment assistance, please refer to the internal documentation or contact the system administrator.
