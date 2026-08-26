# 100% Free Cloud Hosting Guide (Render + Vercel + Upstash)

This guide shows how to deploy the entire BlastRadius stack for **$0 / month** using free tiers:
- **Web App**: Vercel Hobby (100% Free Forever)
- **API Server**: Render Free Web Service (100% Free)
- **Redis**: Upstash Redis or Render Free Redis (100% Free)

---

## 1. Free Redis Setup (2 Options)

### Option A: Upstash Redis (Recommended - Free Forever)
1. Create a free account at [upstash.com](https://upstash.com/).
2. Click **Create Database** -> Name: `blastradius-redis` -> Region: Primary AWS region near you.
3. In the database overview, copy the **`rediss://...`** URL from the "Node" / "ioredis" tab.
4. *Benefit: Never expires, 10,000 commands/day free forever.*

### Option B: Render Free Redis
1. On [Render Dashboard](https://dashboard.render.com/) -> Click **New** -> **Redis**.
2. Select the **Free** instance type.
3. Copy the **Internal Redis URL**. *(Note: Render free Redis expires after 25 days).*

---

## 2. Deploy API Server on Render (Free Web Service)

1. On [Render Dashboard](https://dashboard.render.com/) -> Click **New** -> **Web Service**.
2. Connect your GitHub repository (`benjaminnkem/blastradius`).
3. Configure the service:
   - **Name**: `blastradius-api`
   - **Region**: Oregon (or nearest)
   - **Runtime**: **Docker**
   - **Dockerfile Path**: `apps/api/Dockerfile`
   - **Docker Context**: `.`
   - **Instance Type**: **Free** ($0/month)
4. Set **Environment Variables**:
   - `NODE_ENV` = `production`
   - `PORT` = `10000`
   - `REDIS_URL` = `<PASTE_YOUR_UPSTASH_OR_RENDER_REDIS_URL>`
   - `ARKIV_RPC_URL` = `https://rpc.kaolin.arkiv.network`
   - `ARKIV_CHAIN_ID` = `1001`
   - `ARKIV_PROJECT_NAMESPACE` = `blastradius-v1`
   - `BASE_RPC_PRIMARY` = `https://mainnet.base.org`
   - `BASE_RPC_SECONDARY` = `https://base.llamarpc.com`
   - `BASE_RPC_TERTIARY` = `https://1rpc.io/base`
5. Set **Health Check Path**: `/health/live`
6. Click **Create Web Service**.
7. Once deployed, Render provides your public URL:  
   `https://blastradius-api.onrender.com`

---

## 3. Deploy Web Console on Vercel (Free)

1. Go to [Vercel](https://vercel.com/new) and import your GitHub repository.
2. Under **Project Settings**:
   - **Root Directory**: Click Edit -> select `apps/web`.
   - **Framework Preset**: Next.js
3. In **Environment Variables**, add:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://blastradius-api.onrender.com/api/v1` *(replace with your actual Render API URL)*
4. Click **Deploy**.

---

## 4. Running the Monitor Worker on Free Tier

On Render's free tier, standalone Background Workers are a paid feature ($7/mo). To run the observer monitor for free:

- **Option A (Local / CI Monitor)**: Run the monitor on your local machine, VPS, or a scheduled GitHub Actions cron:
  ```bash
  pnpm --filter @blastradius/monitor start
  ```
- **Option B (Free Cloud Run / Fly.io / Modal / Render Cron)**: Deploy `apps/monitor/Dockerfile` to any free container runner.

---

## 5. Post-Deployment Verification

1. **Verify API is Live**:
   ```bash
   curl https://blastradius-api.onrender.com/health/live
   curl https://blastradius-api.onrender.com/api/v1/incidents
   ```
2. **Access Swagger Docs**:
   - `https://blastradius-api.onrender.com/api/docs`
3. **Visit Web App**:
   - `https://<YOUR_APP>.vercel.app`
