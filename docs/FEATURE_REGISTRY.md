# Vazana — Feature Registry

> File-level audit of every feature domain. Updated: 2026-03-24

## Jobs Domain

| File | Type | Purpose |
|------|------|---------|
| `app/jobs/page.tsx` | Page | Jobs list route |
| `app/jobs/new/page.tsx` | Page | New job creation route |
| `app/api/jobs/route.ts` | API | GET (list), POST (create) |
| `app/api/jobs/[id]/route.ts` | API | GET, PUT, DELETE (single job) |
| `app/api/jobs/import/route.ts` | API | POST (bulk import from Excel) |
| `components/jobs/jobs-page.tsx` | Component | Jobs list UI with search/filter/sort |
| `components/jobs/new-job-form.tsx` | Component | Job creation form with dropdowns |
| `components/jobs/edit-job-modal.tsx` | Component | Job editing dialog |
| `components/jobs/import-jobs-modal.tsx` | Component | Excel import 3-step modal |
| `lib/jobs-import-utils.ts` | Utility | Template generation, parse/validate Excel |
| `lib/ics-calendar.ts` | Utility | .ics calendar file generation |
| `hooks/use-job-form-data.ts` | Hook | Job form state management |

## Clients Domain

| File | Type | Purpose |
|------|------|---------|
| `app/clients/page.tsx` | Page | Clients list route |
| `app/clients/new/page.tsx` | Page | New client route |
| `app/clients/[id]/edit/page.tsx` | Page | Edit client route |
| `app/api/clients/route.ts` | API | GET (list), POST (create) |
| `app/api/clients/[id]/route.ts` | API | GET, PUT (single client) |
| `app/api/clients/[id]/rates/route.ts` | API | GET, PUT (work type rates) |
| `app/api/clients/[id]/payment-logs/route.ts` | API | GET, PUT (payment history) |
| `app/api/clients/test/route.ts` | API | Test endpoint |
| `components/clients/clients-page.tsx` | Component | Clients list with stats |
| `components/clients/new-client-modal.tsx` | Component | Create client dialog |
| `components/clients/client-edit-modal.tsx` | Component | Edit client (3 tabs: info, rates, payments) |

## Workers Domain

| File | Type | Purpose |
|------|------|---------|
| `app/workers/page.tsx` | Page | Workers list route |
| `app/api/workers/route.ts` | API | GET, POST, PUT, DELETE |
| `app/api/workers/[id]/route.ts` | API | Single worker operations |
| `components/workers/workers-page.tsx` | Component | Workers list UI |
| `components/workers/worker-edit-modal.tsx` | Component | Worker editing dialog |

## Vehicles Domain

| File | Type | Purpose |
|------|------|---------|
| `app/vehicles/page.tsx` | Page | Vehicles list route |
| `app/api/vehicles/route.ts` | API | GET, POST, PUT, DELETE |
| `app/api/vehicles/[id]/route.ts` | API | Single vehicle operations |
| `components/vehicles/vehicles-page.tsx` | Component | Vehicles list UI |
| `components/vehicles/vehicle-edit-modal.tsx` | Component | Vehicle editing dialog |

## Carts Domain

| File | Type | Purpose |
|------|------|---------|
| `app/carts/page.tsx` | Page | Carts list route |
| `app/api/carts/route.ts` | API | GET, POST, DELETE |
| `app/api/carts/[id]/route.ts` | API | Single cart operations |
| `components/carts/carts-page.tsx` | Component | Carts list UI (has English text — needs Hebrew) |

## Invoices Domain

| File | Type | Purpose |
|------|------|---------|
| `app/invoices/page.tsx` | Page | Invoices list route |
| `app/invoices/new/page.tsx` | Page | New invoice route |
| `app/invoices/archive/page.tsx` | Page | Archived invoices |
| `app/api/invoices/route.ts` | API | GET, POST |
| `app/api/invoices/[id]/route.ts` | API | Single invoice |
| `app/api/invoices/[id]/pdf/route.ts` | API | PDF generation |
| `app/api/invoices/[id]/line-items/route.ts` | API | Line items CRUD |
| `app/api/sample-data/invoices/route.ts` | API | Sample invoice data |
| `components/invoices/invoices-page.tsx` | Component | Invoices list UI |
| `components/invoices/invoice-preview-modal.tsx` | Component | Invoice preview |
| `components/invoices/view-invoice.tsx` | Component | Invoice detail view |
| `lib/invoice-service.ts` | Utility | Invoice creation + HTML-to-PDF |

## Auth Domain

| File | Type | Purpose |
|------|------|---------|
| `app/auth/login/page.tsx` | Page | Login page |
| `app/auth/sign-up/page.tsx` | Page | Sign-up page |
| `app/api/auth/login/route.ts` | API | POST login |
| `app/api/auth/logout/route.ts` | API | POST logout |
| `app/api/auth/setup-owner/route.ts` | API | One-time owner creation |
| `app/api/auth/create-user/route.ts` | API | Create user (admin only) |
| `app/api/auth/change-password/route.ts` | API | Change password |
| `app/api/auth/profile/route.ts` | API | GET current user profile |
| `app/api/auth/debug/route.ts` | API | Debug auth info |
| `components/auth/auth-provider.tsx` | Component | Auth context + useAuth() hook |
| `components/auth/sign-up-form.tsx` | Component | Registration form |
| `lib/auth-actions.ts` | Utility | Server auth actions |
| `lib/auth-custom.ts` | Utility | Custom auth utilities |
| `lib/client-auth.ts` | Utility | Old localStorage auth (preserved, unused) |
| `lib/setup-root-user.ts` | Utility | Root user initialization |
| `proxy.ts` | Middleware | Session refresh on every request |

## Settings Domain

| File | Type | Purpose |
|------|------|---------|
| `app/settings/page.tsx` | Page | Settings (6 tabs) |
| `app/api/business-settings/route.ts` | API | GET, PUT (upsert) |
| `app/api/user-preferences/route.ts` | API | GET, POST (upsert) |
| `components/settings/settings-business-info.tsx` | Component | Business info form |
| `components/settings/data-export-import.tsx` | Component | Data import/export |
| `components/settings/user-edit-modal.tsx` | Component | User editing |
| `components/settings/resource-modal.tsx` | Component | Generic resource editor |

## Users Domain

| File | Type | Purpose |
|------|------|---------|
| `app/users/page.tsx` | Page | User management route |
| `app/api/users/route.ts` | API | GET, POST, DELETE |
| `app/api/users/[id]/route.ts` | API | Single user operations |
| `components/users/users-page.tsx` | Component | User management UI |

## Dashboard Domain

| File | Type | Purpose |
|------|------|---------|
| `app/page.tsx` | Page | Root/dashboard route |
| `components/dashboard/main-dashboard.tsx` | Component | Main dashboard with stats |
| `components/dashboard/dashboard.tsx` | Component | Dashboard components |
| `components/dashboard/simple-dashboard.tsx` | Component | Alternative dashboard |
| `lib/stats.ts` | Utility | Statistics calculations |

## Documents Domain

| File | Type | Purpose |
|------|------|---------|
| `app/documents/page.tsx` | Page | Documents route |
| `app/api/documents/route.ts` | API | GET, POST, DELETE |
| `app/api/documents/[id]/route.ts` | API | Single document |
| `components/documents/documents-page.tsx` | Component | Documents UI |
| `lib/document-service.ts` | Utility | Upload/download logic |

## Work Types Domain

| File | Type | Purpose |
|------|------|---------|
| `app/api/work-types/route.ts` | API | GET, POST, PUT, DELETE |
| `app/api/work-types/[id]/route.ts` | API | Single work type |
| `components/work-types/work-types-page.tsx` | Component | Work types UI |

## Maintenance Domain

| File | Type | Purpose |
|------|------|---------|
| `app/maintenance/page.tsx` | Page | Maintenance route |
| `app/api/maintenance-logs/route.ts` | API | GET, POST, DELETE |

## Calendar Domain

| File | Type | Purpose |
|------|------|---------|
| `app/calendar/page.tsx` | Page | Calendar route (stub — "coming soon") |
| `lib/ics-calendar.ts` | Utility | .ics file generation |

## Notifications Domain

| File | Type | Purpose |
|------|------|---------|
| `app/api/notifications/route.ts` | API | POST (job notifications via email) |
| `components/notifications/notification-center.tsx` | Component | Notifications UI |
| `lib/email-service.ts` | Utility | Email via Resend |

## Layout & Shared

| File | Type | Purpose |
|------|------|---------|
| `app/layout.tsx` | Layout | Root layout (RTL, theme, auth providers) |
| `app/error.tsx` | Error | Error boundary |
| `app/global-error.tsx` | Error | Global error handler |
| `app/not-found.tsx` | Error | 404 page |
| `app/globals.css` | Style | Global CSS (21KB) |
| `components/layout/app-wrapper.tsx` | Component | Main app wrapper |
| `components/layout/app-navigation.tsx` | Component | Top navigation |
| `components/layout/sidebar-navigation.tsx` | Component | Sidebar menu |
| `components/layout/page-layout.tsx` | Component | Page layout wrapper |
| `components/layout/main-content.tsx` | Component | Main content area |
| `components/layout/loading-overlay.tsx` | Component | Loading state |
| `components/layout/global-alert-provider.tsx` | Component | Global alerts |
| `components/manage-generic-list.tsx` | Component | Reusable CRUD list |
| `components/theme-provider.tsx` | Component | Theme wrapper |
| `components/vazana-app.tsx` | Component | Placeholder |

## Core Libraries

| File | Type | Purpose |
|------|------|---------|
| `lib/supabase/admin.ts` | Client | Admin Supabase (SERVICE_ROLE_KEY) |
| `lib/supabase/server.ts` | Client | Cookie-aware server client |
| `lib/supabase/client.ts` | Client | Browser client |
| `lib/api-client.ts` | Utility | Custom API client class |
| `lib/api-entities.ts` | Utility | API entity wrappers |
| `lib/types.ts` | Types | All TypeScript interfaces |
| `lib/utils.ts` | Utility | General utilities |
| `lib/payment-utils.ts` | Utility | Payment calculations |
| `lib/modal-utils.ts` | Utility | Modal management |
| `lib/custom-alert.ts` | Utility | Custom alert system |
| `lib/global-alert-override.ts` | Utility | Global alert override |
| `lib/simple-auto-save.ts` | Utility | Auto-save functionality |
| `lib/language-context.tsx` | Context | Hebrew/English i18n |
| `lib/theme-context.tsx` | Context | Theme provider |
| `entities/all.ts` | Entity | BaseEntity + 7 entity classes |

## Hooks

| File | Purpose |
|------|---------|
| `hooks/use-job-form-data.ts` | Job form state |
| `hooks/use-resources.ts` | Resource loading (workers, vehicles, carts) |
| `hooks/use-toast.ts` | Toast notifications |
| `hooks/useAutoRefresh.ts` | Auto-refresh data |
| `hooks/useAutoSave.ts` | Auto-save forms |
| `hooks/useUrlMasking.ts` | URL parameter masking |
| `hooks/useUserPreferences.ts` | User preferences persistence |

## Tests

| File | Purpose |
|------|---------|
| `__tests__/utils.test.ts` | Utility function tests (formatCurrency, formatDate, etc.) |
