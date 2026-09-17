# Deploying UDYAM ERP to Neon & Vercel

This guide provides step-by-step instructions to deploy the complete **UDYAM — Business Operations & Inventory ERP** system using:
- **Neon**: Serverless PostgreSQL database with automated connection pooling
- **Vercel**: Full-stack hosting (React client + serverless Express REST API)

---

## 🏗️ Architecture Overview

```text
┌──────────────────────────────────────────────────────────────────┐
│                         VERCEL                                   │
│                                                                  │
│   ┌─────────────────────────────┐   ┌────────────────────────┐   │
│   │   React Frontend (SPA)      │   │  Express Serverless    │   │
│   │   Output: client/dist       │   │  API: api/index.js     │   │
│   │   URL: /                    │   │  URL: /api/*           │   │
│   └──────────────┬──────────────┘   └───────────┬────────────┘   │
└──────────────────┼──────────────────────────────┼────────────────┘
                   │                              │
                   │ (HTTP /api calls)            │ (Prisma ORM with
                   └──────────────────────────────┘  PgBouncer Pooling)
                                                  │
                                                  ▼
                                      ┌────────────────────────┐
                                      │    NEON POSTGRESQL     │
                                      │   Serverless Database  │
                                      │   (aws/eastus2)        │
                                      └────────────────────────┘
```

---

## 📋 Prerequisites

1. A **GitHub** account with this repository pushed.
2. A free **Neon** account ([neon.tech](https://neon.tech)).
3. A free **Vercel** account ([vercel.com](https://vercel.com)).
4. Node.js 18+ installed locally for pushing the initial schema.

---

## Step 1: Set Up Serverless PostgreSQL on Neon

### 1.1 Create Neon Project
1. Log in to your [Neon Console](https://console.neon.tech/).
2. Click **Create Project**.
3. Name your project (e.g. `udyam-db`), select PostgreSQL 16, and pick a region close to your users (e.g. `US East (Ohio)` or `Asia Pacific (Singapore)`).
4. Click **Create Project**.

### 1.2 Copy Connection Strings
Neon will present your connection string in the dashboard:

1. **Pooled Connection String** (select **Pooled connection** checkbox):
   ```text
   postgresql://neondb_owner:npg_xxxx@ep-cool-fog-123456-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   > This will be your `DATABASE_URL` (uses PgBouncer, ideal for Vercel serverless functions).

2. **Direct Connection String** (uncheck **Pooled connection**):
   ```text
   postgresql://neondb_owner:npg_xxxx@ep-cool-fog-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   > This will be your `DIRECT_URL` (direct unpooled connection used for migrations).

---

## Step 2: Push Schema & Seed Initial Data to Neon

Run this from your local terminal to initialize the tables and seed default accounts on Neon:

```bash
# Navigate to the server folder
cd server

# 1. Push database schema to Neon
DATABASE_URL="your_neon_pooled_url" DIRECT_URL="your_neon_direct_url" npx prisma db push

# 2. Seed initial users, products, inventory, and customers
DATABASE_URL="your_neon_pooled_url" DIRECT_URL="your_neon_direct_url" node prisma/seed.js
```

You should see:
```text
🚀 Starting UDYAM database seed...
👤 Created 2 workspace users
👥 Created 4 enterprise customers
📦 Created 6 industrial products with inventory
📋 Created sample enquiry: ENQ-2026-0001
📑 Created sample quotation: QTN-2026-0001
✅ UDYAM database seed completed successfully!
```

---

## Step 3: Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/new).
2. Click **Import Repository** and select your `udyam` repo.
3. Configure the project:
   - **Framework Preset**: `Other` (leave default)
   - **Root Directory**: `./` (leave as project root)
   - **Build & Output Settings**: The repository includes `vercel.json` which automatically configures:
     - Build Command: `npm run vercel-build`
     - Output Directory: `client/dist`
4. Expand **Environment Variables** and add:

| Key | Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://neondb_owner:...-pooler...neon.tech/neondb?sslmode=require` | Neon Pooled connection |
| `DIRECT_URL` | `postgresql://neondb_owner:...neon.tech/neondb?sslmode=require` | Neon Direct connection |
| `JWT_SECRET` | `udyam_enterprise_secure_token_secret_key_2026` | Random secure string |
| `NODE_ENV` | `production` | Production mode |

5. Click **Deploy**.

---

### Option B: Via Vercel CLI

If you prefer deploying directly from the terminal:

```bash
# 1. Install Vercel CLI globally
npm i -g vercel

# 2. Authenticate
vercel login

# 3. Add Environment Variables
vercel env add DATABASE_URL production
vercel env add DIRECT_URL production
vercel env add JWT_SECRET production
vercel env add NODE_ENV production

# 4. Deploy to Production
vercel --prod
```

---

## Step 4: Post-Deployment Smoke Test

Once Vercel completes deployment (usually 1-2 minutes):

1. **Check Health**:
   Visit `https://your-app.vercel.app/health`
   Expected response:
   ```json
   { "status": "ok", "timestamp": "2026-09-17T..." }
   ```

2. **Check Swagger API Docs**:
   Visit `https://your-app.vercel.app/api-docs`
   Confirm interactive OpenAPI documentation loads.

3. **Sign In**:
   Visit `https://your-app.vercel.app`
   Log in with:
   - **Administrator**: `admin@udyam.local` / `Admin@123`
   - **Sales Representative**: `sales@udyam.local` / `Sales@123`

4. **Verify Workflow**:
   - Create an Enquiry
   - Generate a Commercial Quotation
   - Accept the Quotation and Convert to Sales Order
   - Check the live stock reservation
   - Confirm and Dispatch the Order

---

## 🔧 Troubleshooting & Performance Tips

### 1. Connection Limits on Serverless
Serverless functions spin up and down dynamically. Neon's connection pooler (`-pooler` in hostname) handles up to 10,000 concurrent pooled connections using PgBouncer. **Always ensure `DATABASE_URL` has `-pooler` in Vercel.**

### 2. Cold Starts
Neon automatically pauses inactive databases on the free tier after 5 minutes of inactivity. When a request arrives, Neon wakes up within 500ms–1s. If your first login request takes ~1-2 seconds after idle, this is expected behavior.

### 3. Updating Schema in the Future
Whenever you update `schema.prisma`:
```bash
cd server
DATABASE_URL="your_neon_pooled_url" DIRECT_URL="your_neon_direct_url" npx prisma db push
```
Then trigger a redeploy on Vercel so `npx prisma generate` runs during the build step.
