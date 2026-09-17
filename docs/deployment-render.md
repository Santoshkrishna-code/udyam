# Deploying UDYAM Backend to Render

This guide walks you through deploying the **UDYAM ERP Express Backend** to **Render** ([render.com](https://render.com)) and connecting it to a **Neon PostgreSQL Database**, with the **React Frontend on Vercel**.

---

## 🏗️ Architecture

```text
┌─────────────────────────┐          ┌─────────────────────────┐
│     VERCEL (Frontend)   │          │     RENDER (Backend)    │
│   React SPA (client/)   │ ───────► │    Express.js REST API  │
│                         │  HTTP    │    Web Service (server/)│
└─────────────────────────┘  API     └────────────┬────────────┘
                                                  │
                                                  │ Prisma ORM
                                                  ▼
                                     ┌─────────────────────────┐
                                     │     NEON POSTGRESQL     │
                                     │   Serverless Database   │
                                     └─────────────────────────┘
```

---

## 📋 Prerequisites

1. Your repository pushed to **GitHub** ([Santoshkrishna-code/udyam](https://github.com/Santoshkrishna-code/udyam)).
2. A free **Neon** account ([neon.tech](https://neon.tech)) with your connection string.
3. A free **Render** account ([render.com](https://render.com)).

---

## Step 1: Ensure Neon Database is Initialized

If you haven't already pushed your schema and seed data to your Neon database, run this once from your local terminal:

```bash
cd server

# 1. Push schema to Neon
DATABASE_URL="your_neon_pooled_url" DIRECT_URL="your_neon_direct_url" npx prisma db push

# 2. Seed default users, products, stock, and sample data
DATABASE_URL="your_neon_pooled_url" DIRECT_URL="your_neon_direct_url" node prisma/seed.js
```

---

## Step 2: Deploy Backend Web Service on Render

### Option A: Using the Render Blueprint (Recommended — 1-Click)

The repository includes a pre-configured [`render.yaml`](../render.yaml).

1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** → **Blueprint**.
3. Connect your **`Santoshkrishna-code/udyam`** repository.
4. Render will detect the `render.yaml` file automatically.
5. In the configuration screen:
   - Under `DATABASE_URL`, paste your **Neon connection string**.
   - `JWT_SECRET` will be automatically generated.
6. Click **Apply**. Render will build and launch your backend!

---

### Option B: Manual Web Service Setup

If you prefer setting it up manually:

1. In Render Dashboard, click **New +** → **Web Service**.
2. Select your repository: **`Santoshkrishna-code/udyam`**.
3. Configure the service:
   - **Name**: `udyam-backend`
   - **Region**: Select closest to your Neon database (e.g. `Ohio (US East)` or `Oregon (US West)`).
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `node src/server.js`
   - **Instance Type**: `Free`
4. Expand **Advanced** → **Add Environment Variables**:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Production mode |
| `PORT` | `10000` | Port used by Render |
| `DATABASE_URL` | `postgresql://neondb_owner:...@ep-xyz-pooler...neon.tech/neondb?sslmode=require` | Neon connection string |
| `JWT_SECRET` | `udyam_enterprise_secure_token_secret_key_2026` | Random secure string |
| `JWT_EXPIRES_IN` | `7d` | Token expiry duration |

5. Under **Health Check Path**, enter: `/health`
6. Click **Create Web Service**.

Render will deploy your backend at a URL like:
`https://udyam-backend.onrender.com`

---

## Step 3: Connect Vercel Frontend to Render Backend

Now link your React frontend on Vercel to your deployed Render backend:

1. Open your project on [vercel.com](https://vercel.com).
2. Go to **Settings** → **Environment Variables**.
3. Add a new variable:
   - **Key**: `REACT_APP_API_URL`
   - **Value**: `https://your-backend.onrender.com/api` (replace with your actual Render URL + `/api`)
4. Go to the **Deployments** tab on Vercel, click **Redeploy** on the latest deployment.

The React client will now route all API calls to your Render backend!

---

## Step 4: Verify Deployment

1. **Check Backend Health**:
   Open in your browser:
   `https://your-backend.onrender.com/health`
   Expected response:
   ```json
   { "status": "ok", "timestamp": "2026-09-17T..." }
   ```

2. **Check Swagger API Documentation**:
   Open:
   `https://your-backend.onrender.com/api-docs`
   Confirm interactive API docs load and can execute requests against Neon.

3. **Check Frontend**:
   Open your Vercel URL, sign in with:
   - **Admin**: `admin@udyam.local` / `Admin@123`
   - **Sales**: `sales@udyam.local` / `Sales@123`

---

## 💡 Render Free Tier Notice (Cold Starts)

On Render's free tier, the web service spins down after **15 minutes** of inactivity. When a new request arrives, Render takes **~30–50 seconds** to wake up the server.

- This is normal on the free tier.
- Subsequent requests will be instant.
- To prevent sleeping, you can set up a free uptime monitor (like [cron-job.org](https://cron-job.org) or [UptimeRobot](https://uptimerobot.com)) to ping `https://your-backend.onrender.com/health` every 10 minutes.
