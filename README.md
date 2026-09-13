# Runway — Minimalist Personal Expense Tracker & Smart Financial Assistant

Runway is an editorial, production-ready personal expense tracking application designed around a warm paper/ink canvas aesthetic. It combines single-source-of-truth expense management, natural language quick-capture (text & voice), deterministic smart financial insights, budget pacing analytics, interactive monthly calendar views, and strict per-user authorization controls.

---

## 📸 Overview

Runway bridges minimalist design with full-stack enterprise reliability:
- **Warm Paper/Ink Visual System**: Retrained terracotta accent (`#C85A32`), hairline 1px borders, Fraunces serif headers, and monospace metadata tags.
- **Natural Language Quick Capture**: Record expenses like *"Spent ₹450 on dinner at Zaitoon"* or *"Uber 280"* via instant text or speech recognition.
- **Smart Financial Insights**: Deterministic, data-driven engine evaluating spending velocity, category shifts, duplicate transaction alerts, and budget velocity.
- **Single Source of Truth**: Unified PostgreSQL data backend ensuring Dashboard, History, Calendar, and Analytics stay instantly synchronized.

---

## 🛠️ Architecture & Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript & Vite
- **Styling**: Tailwind CSS, custom design tokens, Lucide React icons
- **State & HTTP**: Axios client with dynamic base URL resolution, optimistic UI updates, persistent auth state

### Backend
- **Framework**: Spring Boot 3.2+ with Java 21
- **Database & ORM**: PostgreSQL 16, Spring Data JPA, Hibernate, Flyway Database Migrations
- **Security**: Spring Security, Stateless JWT Authentication, BCrypt Password Hashing
- **Monitoring & Resilience**: Spring Boot Actuator (`/actuator/health`), HikariCP connection pooling, graceful shutdown

### Infrastructure & Deployment
- **Containerization**: Multi-stage Dockerfiles (Maven + Java 21 JRE backend, Node + Nginx Alpine frontend), `docker-compose.yml`
- **Cloud Hosting**: Render (Spring Boot backend + PostgreSQL) & Vercel (React frontend)

---

## ✨ Core Product Features

1. **Quick Capture (NLP & Voice)**:
   - Automated regex & heuristics parser for currency, amount, merchant, category, and date extraction.
   - High-confidence auto-save with instant undo capability.
2. **Dashboard**:
   - Monthly summary cards (Total Spent, Daily Average, Transaction Count, Largest Expense).
   - Real-time recent transaction timeline and budget progress indicator.
3. **Calendar View**:
   - Interactive monthly grid highlighting days with transaction activity.
   - Selected day activity sidebar for precise day-by-day audit.
4. **Analytics & Spending Trends**:
   - Period-over-period comparison (Current vs. Previous month).
   - Dynamic spending over time chart (Daily, Weekly, Monthly granularities).
   - Category distribution breakdown with spend percentages.
5. **Budgets & Pacing**:
   - Per-category monthly limits with visual spending velocity bars.
   - Proactive warnings for categories exceeding 80% or 100% threshold.
6. **Smart Financial Insights**:
   - Algorithmic analysis of transaction history:
     - Spend growth & category surges (e.g., *"Dining spending is 28% higher than last month"*).
     - Weekend vs. weekday spending trends.
     - Potential duplicate transaction warnings.
     - Budget pacing forecasts based on run-rate.

---

## 🔒 Security Architecture

- **IDOR Protection**: Strict per-user database scoping on all CRUD operations (`WHERE expense.user_id = :userId`).
- **JWT Authorization**: Transmitted via standard `Bearer` tokens with expiration and refresh mechanics.
- **Public Endpoints**: Strictly limited to `/api/v1/auth/**` and `/actuator/health`.
- **CORS Hardening**: Explicit origin whitelisting configured via `RUNWAY_CORS_ALLOWED_ORIGINS`.

---

## 🧪 Testing & Verification

Runway includes **32 automated tests** covering core domains, security boundaries, and natural language extraction logic:

```bash
cd backend
mvn test
```

### Verified Test Categories:
- **Authentication & User Management**: Signup, login, password validation, duplicate username handling.
- **IDOR & Cross-User Security**: Isolation verification preventing unauthorized cross-user expense/budget access.
- **NLP Parser Engine**: Pattern extraction for multi-currency expressions, relative dates ("yesterday", "this morning"), merchant resolution, and fallback handling.
- **Smart Insights Engine**: Growth calculations, highest-spending category identification, duplicate detection logic.
- **Budget Pacing Calculations**: Spend percentage calculations and over-budget threshold triggers.

---

## 🚀 Quick Start (Local Setup)

### Option A: Using Docker Compose (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/Runway.git
   cd Runway
   ```
2. Copy environment template:
   ```bash
   cp .env.example .env
   ```
3. Launch with Docker Compose:
   ```bash
   docker-compose up --build -d
   ```
4. Access the application:
   - **Frontend UI**: [http://localhost](http://localhost)
   - **Backend API**: [http://localhost:8080/api/v1](http://localhost:8080/api/v1)
   - **Health Check**: [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)

---

### Option B: Manual Local Setup

#### 1. Database Setup
Start a PostgreSQL instance locally and create the database `runway_db`:
```sql
CREATE DATABASE runway_db;
```

#### 2. Backend Setup
```bash
cd backend
# Set environment variables or use default application.yml values
export DB_URL=jdbc:postgresql://localhost:5432/runway_db
export DB_USERNAME=postgres
export DB_PASSWORD=postgres
export JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970

mvn spring-boot:run
```

#### 3. Frontend Setup
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🌐 Environment Variables Reference

| Variable | Description | Default / Example |
|---|---|---|
| `DB_URL` | PostgreSQL JDBC connection string | `jdbc:postgresql://localhost:5432/runway_db` |
| `DB_USERNAME` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `postgres` |
| `JWT_SECRET` | 256-bit secret key for JWT validation | `404E63...` |
| `RUNWAY_CORS_ALLOWED_ORIGINS` | Allowed origins for CORS | `http://localhost:5173,http://localhost:80` |
| `PORT` | Spring Boot HTTP port | `8080` |
| `VITE_API_URL` | Frontend API Base URL | `http://localhost:8080/api/v1` |

---

## 📄 License

MIT License. Designed and engineered as a modern, production-grade expense management experience.
