# Angels Home Education Center — School Management System

A school management platform for coordinating learner records, academic administration, staff workflows, fees and day-to-day school operations.

## Product capabilities

The backend domain includes:

- Admissions, pupil profiles and student academic records.
- Academic years, classes, subjects and teacher allocations.
- Attendance, examinations, assessment results and report cards.
- Fee structures, payment records and transaction tracking.
- Timetables, lesson planning and lesson reminders.
- Library resources, learning content and learning records.
- School events, announcements, galleries and communications.
- Transport routes, meal plans, inventory and school settings.

The platform also includes administrative controls and integrations for media storage, messaging and payment providers. Availability of any external service depends on valid deployment configuration and provider-side acceptance.

## Technology

| Layer | Technologies |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS |
| Backend | Node.js, Express 4 |
| Database | MongoDB with Mongoose |
| Authentication | JWT and bcrypt |
| Security | Helmet, CORS allow-listing, rate limiting, Mongo sanitisation and XSS sanitisation |
| Media | Cloudinary |
| Integrations | Safaricom Daraja, PayPal, Africa's Talking and WhatsApp Cloud API |

## Repository structure

- `client/` — React application.
- `server/` — API, models, controllers, routes, services and operational scripts.
- `docs/PRODUCTION_READINESS.md` — deployment, security, timetable, backup and release guidance.
- `render.yaml` — Render service configuration.

## Local development

**Backend**
```bash
cd server
npm install
cp .env.example .env
# Configure MongoDB, JWT and the integrations you intend to use.
npm run dev
```

**Frontend** (in a second terminal)
```bash
cd client
npm install
cp .env.example .env
npm run dev
```

## Production checks and operations

Run the backend production configuration check:

```bash
cd server
npm run check:production
```

Create a database backup using the server's backup script:

```bash
cd server
npm run backup:database
```

For the full release gate, follow [the production-readiness runbook](docs/PRODUCTION_READINESS.md). It documents frontend lint/build, backend syntax checks, secure environment configuration, encrypted backups and restore testing.

## Environment and security

Use `server/.env.example` as the configuration reference. Store production values in the deployment provider's secret manager. Never commit real database URIs, JWT secrets, payment credentials, administrator passwords or messaging tokens.

Payment requests must not be represented as completed payments until the server has verified the provider callback and transaction details. Use provider sandbox environments until the full callback lifecycle has been tested.

## Deployment status

A successful build or automated test run is not, on its own, proof of production readiness. Verify the deployed API, school-specific access controls, payment callbacks, messaging providers, backups and restore process before onboarding a school.
