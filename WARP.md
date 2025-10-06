# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Vazana Studio is a Hebrew/English bilingual business management system built with Next.js 15, TypeScript, and Supabase. The application manages clients, jobs, workers, vehicles, carts, invoices, and documents for a construction/maintenance business.

This is a v0.app project that syncs automatically with deployments on Vercel.

## Development Commands

### Package Management
- Use **pnpm** as the package manager (pnpm-workspace.yaml present)
- Install dependencies: `pnpm install`

### Development
- Start development server: `pnpm dev` (runs Next.js dev server)
- Build production: `pnpm build`
- Start production server: `pnpm start`
- Lint code: `pnpm lint`

### Testing
- No specific test scripts configured in package.json
- To add tests, consider using Jest or Vitest with React Testing Library

## Architecture Overview

### Key Directories
- **`app/`**: Next.js 15 App Router pages with file-based routing
  - Each business module has its own route (clients, jobs, workers, vehicles, etc.)
  - `layout.tsx` handles RTL layout, themes, and providers
- **`components/`**: React components organized by feature
  - `auth/`: Login and signup forms
  - `dashboard/`: Main dashboard components
  - `layout/`: Sidebar navigation and loading overlay
  - `ui/`: Reusable UI components (Radix UI based)
  - Feature-specific directories (clients, jobs, invoices, etc.)
- **`entities/`**: Supabase entity classes with CRUD operations
  - `all.ts` contains BaseEntity class and all business entities
  - Uses class inheritance pattern for common database operations
- **`lib/`**: Core utilities and services
  - `api-client.ts`: Custom API client (replacing Base44 SDK)
  - `auth-actions.ts`: Server actions for authentication
  - `theme-context.tsx`: Custom theme provider
  - Various service files for calendar, documents, invoices, email
- **`hooks/`**: Custom React hooks
- **`styles/`**: Additional styling (main styles in app/globals.css)
- **`scripts/`**: Setup and utility scripts

### Technology Stack
- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4 with custom Vazana Studio brand colors
- **UI Components**: Radix UI primitives with shadcn/ui patterns
- **Database**: Supabase (client-side integration)
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Fonts**: Custom Hebrew (Alef) and English (Futura) fonts
- **Charts**: Recharts
- **Package Manager**: pnpm

### Authentication System
- Simple hardcoded authentication (username: "root", password: "10203040")
- Uses localStorage for client-side session management
- Server-side cookies for actual session management
- No user registration - admin-managed users only

### Database Architecture
- Entity-based architecture with inheritance
- Base entity class provides common CRUD operations
- Entities: Client, Job, Worker, Vehicle, Cart, WorkType, Receipt, User
- Uses Supabase client for database operations

### Internationalization
- RTL (Right-to-Left) layout support for Hebrew
- Bilingual interface (Hebrew/English)
- Hebrew-first design with `dir="rtl"` and custom fonts
- Text direction utilities in CSS

### Styling System
- Custom CSS variables for Vazana brand colors
- Theme system with light/dark mode support
- Custom font loading for Hebrew and English typefaces
- Tailwind CSS with brand-specific color palette

## Important Development Notes

### File Structure Patterns
- Feature-based organization in components directory
- Each major business entity has its own page and components
- Shared UI components use Radix UI primitives

### Entity Management
- All database entities extend from BaseEntity in `entities/all.ts`
- Consistent CRUD patterns across all entities
- Supabase client handles all database operations

### Authentication Flow
- Root page checks localStorage for authentication state
- Redirects to `/auth/login` if not authenticated
- Server actions handle login/logout operations
- No registration flow - users created by admin

### Theme and Styling
- Custom brand colors defined in CSS variables
- Font system supports Hebrew (Alef) and English (Futura)
- RTL layout support throughout the application
- Dynamic theme switching capabilities

### API Patterns
- Custom ApiClient class in `lib/api-client.ts`
- Consistent REST-like patterns for all entities
- Authentication token passed via localStorage

## Business Domain

This system manages:
- **Clients**: Companies with contact information and VAT IDs
- **Jobs**: Work orders with client relationships, site locations, and payment status
- **Workers**: Staff members with availability tracking
- **Vehicles**: Fleet management with license plates and models
- **Carts**: Equipment/container management
- **Invoices/Receipts**: Financial document management
- **Documents**: File and document storage
- **Users**: System user management (admin-controlled)

The application appears to be designed for a Hebrew-speaking construction or maintenance business with complex scheduling and resource management needs.