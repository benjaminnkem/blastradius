# Cloud Hosting Deployment Guide

This guide walks through deploying the **BlastRadius API & Monitor to Render** and the **BlastRadius Web Console to Vercel**.

---

## Part 1: Deploying to Render (API, Monitor Worker, Redis)

Render supports automated deployment using the included [`render.yaml`](file:///Users/tochison/Desktop/Projects/blastradius/render.yaml) Blueprint or manual service creation.

### Option A: Automated Render Blueprint (Recommended)
1. Push your repository to GitHub.
2. Go to [Render Dashboard](https://dashboard.render.com/) -> **Blueprints** -> **New Blueprint Instance**.
3. Select your repository.
4. Render will automatically parse `render.yaml` and create 3 services:
   - **`blastradius-api`** (Docker Web Service)
   - **`blastradius-monitor`** (Docker Background Worker)
   - **`blastradius-redis`** (Redis Instance)
5. Fill in the secret environment variable:
   - `MONITOR_PRIVATE_KEY`: Your dedicated monitor EVM private key funded with testnet gas.
6. Click **Apply**.
7. Once deployed, note your public API URL (e.g. `https://blastradius-api.onrender.com`).

---

### Option B: Manual Setup on Render

#### 1. Create Redis Instance
- Click **New** -> **Redis**.
- Name: `blastradius-redis`.
- Plan: Free.
- Copy the **Internal Redis URL** (`redis://...`).

#### 2. Create the API Web Service
- Click **New** -> **Web Service**.
- Source: Your GitHub repository.
- Runtime: **Docker** (`apps/api/Dockerfile`).
- Root Directory: `.`
- Health Check Path: `/health/live`
- Environment Variables:
  - `NODE_ENV`: `production`
  - `PORT`: `10000`
  - `REDIS_URL`: `<PASTE_INTERNAL_REDIS_URL>`
  - `ARKIV_RPC_URL`: `https://rpc.kaolin.arkiv.network`
  - `ARKIV_CHAIN_ID`: `1001`
  - `ARKIV_PROJECT_NAMESPACE`: `blastradius-v1`
  - `BASE_RPC_PRIMARY`: `https://mainnet.base.org`
  - `BASE_RPC_SECONDARY`: `https://base.llamarpc.com`
  - `BASE_RPC_TERTIARY`: `https://1rpc.io/base`

#### 3. Create the Monitor Background Worker
- Click **New** -> **Background Worker**.
- Source: Your GitHub repository.
- Runtime: **Docker** (`apps/monitor/Dockerfile`).
- Root Directory: `.`
- Environment Variables:
  - `NODE_ENV`: `production`
  - `REDIS_URL`: `<PASTE_INTERNAL_REDIS_URL>`
  - `ARKIV_RPC_URL`: `https://rpc.kaolin.arkiv.network`
  - `ARKIV_CHAIN_ID`: `1001`
  - `ARKIV_PROJECT_NAMESPACE`: `blastradius-v1`
  - `BASE_RPC_PRIMARY`: `https://mainnet.base.org`
  - `BASE_RPC_SECONDARY`: `https://base.llamarpc.com`
  - `BASE_RPC_TERTIARY`: `https://1rpc.io/base`
  - `MONITOR_PRIVATE_KEY`: `0x...` (Your funded private key)

---

## Part 2: Deploying to Vercel (Next.js Web Console)

1. Go to [Vercel Dashboard](https://vercel.com/new) -> **Add New Project**.
2. Import your GitHub repository.
3. In **Project Settings**:
   - **Framework Preset**: Next.js
   - **Root Directory**: Click Edit -> select `apps/web`.
   - Keep default build command (`next build` or turbo).
4. In **Environment Variables**, add:
   - **`NEXT_PUBLIC_API_URL`**: `https://<YOUR_RENDER_API_URL>/api/v1`  
     *(e.g. `https://blastradius-api.onrender.com/api/v1`)*
5. Click **Deploy**.

---

## Part 3: Verification After Deployment

1. **Verify API Health Probes**:
   - `GET https://<YOUR_RENDER_API_URL>/health/live` → `{"status":"ok"}`
   - `GET https://<YOUR_RENDER_API_URL>/health/ready` → `{"status":"ok"}`
   - `GET https://<YOUR_RENDER_API_URL>/api/v1/incidents` → `{"success":true,"data":[]}`
2. **Verify Swagger API Docs**:
   - `GET https://<YOUR_RENDER_API_URL>/api/docs`
3. **Verify Web Console on Vercel**:
   - Visit `https://<YOUR_VERCEL_DOMAIN>.vercel.app`.
   - Open browser developer tools network tab to verify successful requests to `NEXT_PUBLIC_API_URL`.
