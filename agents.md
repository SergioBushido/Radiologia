# SIGEO Agent Rules & Context

Welcome, Agent. This document provides the essential context and rules for working on the **SIGEO (Sistema Integral de Gestión de Efectivos Operativos)** codebase.

## 🏗 Project Overview
SIGEO is a corporate platform for managing medical shifts (specifically for Radiology departments). Its goal is to optimize scheduling using fairness algorithms, centralize communication, and ensure rest/coverage rules are met.

## 🛠 Tech Stack
- **Framework**: Next.js 13 (Pages Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS (Mobile-first, Glassmorphism, Dark/Light modes)
- **Database/ORM**: PostgreSQL (Supabase) + Prisma
- **Auth**: JWT (JSON Web Tokens)
- **Utilities**: `date-fns` for date manipulation

## 📁 Architecture
- `components/`: Reusable React components (Calendar, Modals, Nav).
- `lib/`: Core business logic.
    - `shiftGenerator.ts`: The heart of the system (Backtracking algorithm).
    - `prisma.ts`: Prisma client instance.
- `pages/`: 
    - `api/`: Backend endpoints.
    - `admin/`: Administrative dashboard.
    - `index.tsx`: Main user dashboard.
- `prisma/`: Database schema and migrations.
- `styles/`: Tailwind config and global CSS.

## 🧠 Core Logic: Guard Generation Algorithm (`lib/shiftGenerator.ts`)
The algorithm uses **conditional backtracking** to find optimal shift assignments.

### Hard Constraints (Non-negotiable)
- **Mandatory Rest**: Minimum 48 hours between consecutive shifts.
- **Monthly Limits**: 
    - Max 1 Thursday per month.
    - Max 1 Friday per month.
    - Max 2 weekends (Sat/Sun) per month.
- **Group Incompatibilities**: Users in the same group (e.g., 'MAMA') cannot coincide, except for group 'STANDARD'.
- **Exclusion Days**: No assignments on Vacations, Courses, or "LD" days.
- **Pair Incompatibilities**: Specific groups (e.g., MAMA and URGENCIAS) cannot work together.

### Soft Constraints (Equity System)
- **Declared Preference**: High priority to assigned "PREFERENCE" days.
- **Equity**: Prioritization of users with lower historical/current monthly load.
- **Avoid Blocks**: Penalization of users who marked a day as "BLOCK".

## 📜 Agent Guidelines

### 1. Coding Standards
- Use **TypeScript** strictly. Avoid `any`.
- Follow **Pages Router** conventions for Next.js.
- Ensure **responsive design** (mobile-first) in all UI components.

### 2. UI/UX Principles
- **Premium Aesthetics**: Use `backdrop-filter` (glassmorphism), smooth transitions, and pulse effects for loading states.
- **Custom Modals**: Never use native `window.confirm`. Use the custom modal components provided in `components/`.
- **Feedback**: Always provide visual feedback for async actions (loading states, success/error toast notifications).

### 3. Database & Logic
- When modifying the schema, remember to run `npx prisma generate`.
- Be extremely careful when editing `lib/shiftGenerator.ts`. Any change to the backtracking logic can have significant performance or equity implications.
- Use `date-fns` for all date calculations to maintain consistency.

### 4. Naming Conventions
- Components: PascalCase (`CalendarBoard.tsx`).
- API Routes: kebab-case (`/api/shift-requests`).
- Database Maps: Use `@map` in Prisma to keep database columns snake_case or camelCase consistently as defined.

---
*SIGEO - Optimizing healthcare equity and rest through intelligent automation.*
