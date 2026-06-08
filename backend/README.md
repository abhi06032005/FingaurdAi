# NSE Stock Intelligence Data Platform

A production-ready Node.js & TypeScript data collection, ingestion, and AI stock research report generation platform. All quantitative and qualitative details are gathered from **Screener.in** (metadata, financials, ratios, and ownership) and **NSE India** (corporate developments/announcements), and saved to Neon PostgreSQL. Decoupled design ensures user endpoints retrieve pre-computed contexts instantly, avoiding on-demand scraping and rate limits.

---

## 🛠️ Environment Setup & Neon Configuration

Prisma v7 manages connection configurations dynamically in `prisma.config.ts`. To connect the backend to your Neon PostgreSQL instance:

1. Locate the `.env` file at `backend/.env`.
2. Update the `DATABASE_URL` with your Neon connection string. (Be sure to use the connection pooler or direct connection URL as required):
   ```env
   DATABASE_URL="postgresql://<user>:<password>@<neon-hostname>/finguard?sslmode=require"
   ```
3. Set your Groq API key:
   ```env
   GROQ_API_KEY="your-groq-api-key"
   ```

---

## 🚀 Setup & Execution Instructions

Follow these steps to initialize and run the platform:

### 1. Install Dependencies
In the `backend` directory, run:
```bash
pnpm install
```

### 2. Generate Prisma Client & Sync Schema
Apply the schema design directly to your Neon PostgreSQL instance:
```bash
npx prisma generate
npx prisma db push
```

### 3. Seed Initial Companies
Populate the database with a seed list of major companies (TCS, RELIANCE, INFY, HDFCBANK, ICICIBANK, LT):
```bash
npx ts-node src/scripts/seed.ts
```

### 4. Manually Run Ingestion Scrapers (Admin CLI)
To scrape, ingest, and pre-compute the stock research context for a specific ticker (e.g., TCS):
```bash
npx ts-node src/scripts/runScrapers.ts --ticker TCS
```
This script will execute all 9 scrapers, write to the database tables, and compile the final JSON context in the `company_research_context` table.

### 5. Start Express API Server & Cron Schedulers
To start the server in development mode (with background cron schedules initialized):
```bash
pnpm run dev
```

---

## 📡 API Endpoints

### 1. User: Fetch Stock Research Report
- **URL**: `GET /symbol/:symbol`
- **Description**: Instantly retrieves the pre-computed stock intelligence context from the DB and calls the Groq LLM to write a publication-grade report.
- **Response**:
  ```json
  {
    "ticker": "TCS",
    "lastUpdated": "2026-05-31T13:45:00.000Z",
    "report": "# Executive Summary...",
    "context": { ... }
  }
  ```

### 2. Admin: Trigger Stock Ingestion
- **URL**: `POST /admin/scrape`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "ticker": "RELIANCE"
  }
  ```
- **Description**: Triggers all 9 independent scrapers sequentially, updates the DB tables, and compiles/saves the pre-computed JSON research context.

---

## 🐳 Docker Production Setup

To start the database and backend services using Docker Compose:

1. Ensure Docker Desktop is running on your host system.
2. Build and spin up the containers:
   ```bash
   docker compose up --build -d
   ```
3. Apply database schemas inside the container:
   ```bash
   docker exec -it finguard_backend npx prisma db push
   docker exec -it finguard_backend npx ts-node src/scripts/seed.ts
   ```
