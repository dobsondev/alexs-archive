# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server with Turbo (port 3000)
- `npm run build` - Build the Next.js application
- `npm run start` - Start production server
- `npm run preview` - Build and start production server

### Code Quality
- `npm run check` - Run both linting and type checking
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run typecheck` - Run TypeScript type checking
- `npm run format:write` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Database Management
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:migrate` - Run Drizzle migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio database UI

### Docker Development
- `docker compose up -d` - Start local development environment with remote Neon development Postgres database
- `docker compose -f docker-compose.local.yml up -d` - Start local development environment with local Docker Postgres database
- `docker compose [-f docker-compose.local.yml] down -v` - Stop containers and remove volumes
- Local database URL: `postgresql://postgres:devpass@localhost:5432/postgres`

## Architecture Overview

This is a Next.js 15 eBook storage application built with the T3 Stack, featuring:

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js with Auth0
- **Styling**: Tailwind CSS with Flowbite React components
- **File Storage**: UploadThing for ePub file uploads
- **Email**: Resend for sending books to Kindle
- **Type Safety**: TypeScript with strict configuration
- **Environment**: T3 env validation with Zod

### Core Features
1. **Book Management**: Upload ePub files with Goodreads metadata scraping
2. **Authentication**: Auth0 integration with user permissions
3. **Send to Kindle**: Email ePub files to users' Kindle devices
4. **User Permissions**: Upload permission system for controlling access

### Directory Structure
- `src/app/` - Next.js App Router pages and components
  - `_components/` - Shared React components (BookCard, TopBar, etc.)
  - `_actions/` - Server actions for profile and Kindle sending
  - `_utils/` - Utilities for email, file upload, and Goodreads scraping
  - `api/` - API routes for auth, file upload, and Goodreads integration
- `src/server/` - Server-side code
  - `auth/` - NextAuth.js configuration with Auth0
  - `db/` - Drizzle database configuration and schema
- `drizzle/` - Database migrations
- `docs/` - Setup documentation for Auth0, Resend, and UploadThing

### Database Schema
- `users` - User accounts with upload permissions and Kindle email
- `books` - Book metadata with Goodreads data and UploadThing URLs
- `accounts/sessions` - NextAuth.js authentication tables

### Key Integrations
- **Goodreads Scraping**: Automatic metadata extraction using book IDs
- **UploadThing**: Secure file uploads with middleware validation
- **Auth0**: OAuth authentication with custom profile mapping
- **Resend**: Email service for Kindle delivery

### Environment Variables
Required variables are validated through `src/env.js`:
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_ISSUER` - Auth0 config
- `UPLOADTHING_TOKEN` - File upload service
- `RESEND_API_KEY` - Email service
- `AUTH_SECRET` - NextAuth.js secret (production only)

### Path Aliases
- `~/` maps to `src/` directory for cleaner imports

### Development Notes
- Database schema uses `alexs-archive_` table prefix
- File uploads expect format: `{goodreads-id}.epub`
- Docker provides local Postgres database for development
- Drizzle Studio provides database GUI on local development
