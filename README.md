# Sifratech Ticket Portal

## Overview

The Sifratech Ticket Portal is a comprehensive, enterprise-grade Help Desk, IT Service Management (ITSM), and Account Management system designed to streamline communication between clients and support teams. The portal provides an intuitive interface for clients to raise issues, a robust workspace for engineers to triage and resolve tickets, and advanced business reporting tools for Account Managers to generate Periodic Status Reports (PSR) and Strategic Business Case Studies.

The system is built as a modern, decoupled web application featuring a React-based frontend and an Express/Node.js backend, powered by a Supabase PostgreSQL database.

## Architecture

The project is structured as a monorepo containing both the frontend and backend applications:

- **sifratech-portal-react**: The frontend user interface built with React 18, Vite, Tabler Icons, and modern CSS principles.
- **sifratech-backend**: The backend REST API server built with Express.js, featuring modular controllers, role-based middlewares, scheduled jobs, Graph API email listeners, and AI ingestion pipelines.
- **Database Layer**: Supabase PostgreSQL with Row Level Security (RLS) policies and dedicated migration tables (`reports_business_cases`, `reports_wsr_drafts`, `tickets`, `ticket_comments`).
- **AI & Token Optimization Layer**: Hybrid intelligence layer connecting Groq Cloud API, Google Generative AI (Gemini 3.6 Flash), and a deterministic real-time DB data synthesis fallback engine for zero-downtime, token-efficient content generation.

### High-Level System Architecture Diagram

```
+-----------------------------------------------------------------------------+
|                            SIFRATECH REACT PORTAL                           |
|  [ Dashboard ]  [ Tickets ]  [ Account Reports ]  [ Team ]  [ Settings ]    |
+------------------------------------+----------------------------------------+
                                     |  HTTP REST / Bearer JWT
                                     v
+-----------------------------------------------------------------------------+
|                            EXPRESS BACKEND API                              |
|  - AuthMiddleware (JWT verification)                                        |
|  - AccountManagerMiddleware (RBAC for Account Managers & Admins)            |
|  - WebhookController (Microsoft Graph Mailbox Ingestion)                   |
|  - ReportsController (/api/reports/cases, /api/reports/bcs-generate)        |
+-------------------+=+-----------------------------------+-------------------+
                    | |                                   |
     SQL Queries /  | | RLS                               | AI Telemetry Data
     Realtime Sync  v v                                   v
+-----------------------------------+   +-------------------------------------+
|        SUPABASE POSTGRESQL        |   |       HYBRID AI ENGINE (AIService)   |
|  - tickets & ticket_comments      |   |  1. Groq Cloud API                  |
|  - reports_business_cases         |   |  2. Google Gemini 3.6 Flash         |
|  - reports_wsr_drafts             |   |  3. Real-Time DB Fallback Synthesizer|
+-----------------------------------+   +-------------------------------------+
```

## Key Features

- **Role-Based Access Control (RBAC)**: Enforced interfaces for Customers, Support Engineers, Account Managers, and Administrators.
- **Account Reports & Executive Business Documentation**:
  - **Periodic Status Reports (PSR)**: Automated weekly/periodic operational status telemetry (New, Resolved, Closed, Backlog, AI Executive Summary).
  - **Strategic Business Case Studies**: 6-section enterprise document generator (Current Situation & Challenges, Existing Landscape & Modules, Solution, Business Impact & Operational Results, Observations & Lessons Learned, Future Recommendations & Optimization Roadmap).
- **Real-Time DB & Token-Efficient AI Auto-fill**:
  - Automatically queries actual ticket descriptions, ticket numbers (e.g., `TKT-2026-876733`), project references (e.g., `YS-543/2025.146.01`), and engineer comments from Supabase.
  - Generates tangible, factual executive content while minimizing AI API token usage.
  - 100% editable form editor with print-ready PDF export views.
- **Client Segregation & SLA Management**: Multi-tenant architecture ensuring client data isolation with dynamic SLA breach timers.
- **Automated Email Ingestion & Reply Suggestions**: Microsoft Graph API integration for mailbox monitoring and AI-assisted customer reply drafts.

## Technical Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Icons & UI Components**: `@tabler/icons-react`, `react-hot-toast`
- **Routing**: React Router DOM v6
- **State & Context**: React Context API, Supabase Auth

### Backend
- **Runtime**: Node.js v18+ / v24+
- **Server Framework**: Express.js
- **Database**: PostgreSQL (hosted on Supabase)
- **Integrations**: Microsoft Graph API, Groq Cloud API, Google Generative AI (`@google/genai`)

## Security Audit & Compliance

- **Role-Based Middleware Protection**: All report endpoints (`/api/reports/*`) are guarded by `authMiddleware` and `accountManagerMiddleware`, ensuring unauthorized roles cannot view or edit business case studies or account drafts.
- **Parameterized Database Queries**: All Supabase client interactions use parameterized query builders, preventing SQL injection vulnerabilities.
- **Secure Token & Key Storage**: Sensitive credentials (`SUPABASE_SERVICE_KEY`, `GROQ_API_KEY`, `GEMINI_API_KEY`) are managed strictly via server-side environment variables (`.env`).
- **Resilient Fallback Design**: Token consumption is controlled with concise prompt structuring and a zero-token real-time DB fallback engine to prevent outage risks during credit limits or API service degradation.

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- NPM package manager
- A Supabase Project (Database, Auth, Storage)

### Installation & Local Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/VaishalMalu/Sifratech-Ticket-Portal.git
   cd Sifratech-Ticket-Portal
   ```

2. **Frontend Setup**
   ```bash
   cd sifratech-portal-react
   npm install
   npm run dev
   ```

3. **Backend Setup**
   ```bash
   cd ../sifratech-backend
   npm install
   npm start
   ```

## Support & Deployment

- **Frontend Deployment**: Can be statically built (`npm run build`) and hosted on Vercel, Netlify, or Azure Static Web Apps.
- **Backend Deployment**: Cloud-native Node.js service compatible with Render, Heroku, or Azure App Service.
