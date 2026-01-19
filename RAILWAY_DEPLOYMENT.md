# Railway Deployment Guide for Semantle Backend

This guide will help you deploy the Semantle backend to Railway.

## Prerequisites

1. A Railway account (sign up at [railway.app](https://railway.app))
2. An OpenAI API key (get one from [platform.openai.com](https://platform.openai.com))
3. Your Vercel frontend URL (if already deployed)

## Step 1: Prepare Your Repository

The backend is located in the `backend/` directory. Make sure you have:
- ✅ `backend/main.py` - FastAPI application
- ✅ `backend/requirements.txt` - Python dependencies
- ✅ `backend/words.json` - Word dictionary (already copied)
- ✅ `backend/Procfile` - Railway start command
- ✅ `backend/railway.json` - Railway configuration

## Step 2: Deploy to Railway

### Option A: Deploy via Railway Dashboard

1. **Create a New Project**
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo" (recommended) or "Empty Project"

2. **Connect Your Repository**
   - If using GitHub, select your repository
   - Railway will detect it's a Python project

3. **Configure the Service**
   - **Option 1 (Recommended):** Set the **Root Directory** to `backend`
     - Railway will use `backend/Procfile` and `backend/requirements.txt`
     - This is the cleanest configuration
   - **Option 2:** Leave Root Directory as root (default)
     - Railway will use the root-level `Procfile` and `requirements.txt`
     - These automatically reference the backend directory
     - Note: Railway might detect Node.js first (due to root `package.json`), so Option 1 is preferred

4. **Set Environment Variables**
   - Go to your service → **Variables** tab
   - Add the following variables:
     ```
     OPENAI_API_KEY=your-openai-api-key-here
     ALLOWED_ORIGINS=https://your-app.vercel.app,http://localhost:3000
     ```
   - Replace `your-openai-api-key-here` with your actual OpenAI API key
   - Replace `https://your-app.vercel.app` with your Vercel frontend URL

5. **Deploy**
   - Railway will automatically start building and deploying
   - Wait for the deployment to complete
   - Your backend will be available at a Railway-provided URL (e.g., `https://your-app.up.railway.app`)

### Option B: Deploy via Railway CLI

1. **Install Railway CLI**
   ```bash
   npm i -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Initialize Project**
   ```bash
   cd backend
   railway init
   ```

4. **Set Environment Variables**
   ```bash
   railway variables set OPENAI_API_KEY=your-openai-api-key-here
   railway variables set ALLOWED_ORIGINS=https://your-app.vercel.app,http://localhost:3000
   ```

5. **Deploy**
   ```bash
   railway up
   ```

## Step 3: Get Your Backend URL

After deployment, Railway will provide you with a URL like:
- `https://your-app.up.railway.app`

This is your backend API URL. You'll need this for the frontend configuration.

## Step 4: Update Frontend Configuration

1. **In Vercel Dashboard:**
   - Go to your project → **Settings** → **Environment Variables**
   - Add a new variable:
     - **Name:** `VITE_API_URL`
     - **Value:** `https://your-app.up.railway.app/api`
   - Make sure to select all environments (Production, Preview, Development)
   - Redeploy your frontend

2. **Or create a `.env.production` file in the `frontend/` directory:**
   ```
   VITE_API_URL=https://your-app.up.railway.app/api
   ```

## Step 5: Verify Deployment

1. **Test Backend Health:**
   - Visit `https://your-app.up.railway.app/`
   - You should see: `{"message": "Semantle API is running"}`

2. **Test API Endpoint:**
   - Visit `https://your-app.up.railway.app/api/game/new`
   - You should get a JSON response with a game session

3. **Test Frontend Connection:**
   - Open your Vercel frontend
   - Try creating a new game
   - It should connect to your Railway backend

## Troubleshooting

### Backend Not Starting

- **Check Logs:** Go to Railway dashboard → Your service → **Deployments** → Click on the latest deployment → View logs
- **Common Issues:**
  - Missing `OPENAI_API_KEY` environment variable
  - Port configuration issues (Railway sets `PORT` automatically)
  - **"uvicorn: command not found" or "ModuleNotFoundError":**
    - Railway should automatically install dependencies from `requirements.txt`
    - Check build logs for `pip install` output - you should see packages being installed
    - If dependencies aren't installing:
      1. Verify `requirements.txt` exists in root directory (references `backend/requirements.txt`)
      2. Check that Railway is detecting Python (should see Python version in build logs)
      3. Ensure Railway root directory is set correctly (root or backend both work)
      4. The Procfile now uses `python -m uvicorn` which is more reliable
  - **If Railway detects Node.js instead of Python:**
    - Railway might prioritize `package.json` over `requirements.txt`
    - Solution: Set the **Root Directory** to `backend` in Railway settings
    - Or ensure `requirements.txt` and `Procfile` are in root directory

### CORS Errors

- Make sure `ALLOWED_ORIGINS` includes your Vercel frontend URL
- Format: `https://your-app.vercel.app,http://localhost:3000` (comma-separated, no spaces)

### API Not Responding

- Check that the service is running in Railway dashboard
- Verify the Railway URL is correct
- Check that `VITE_API_URL` in Vercel matches your Railway URL + `/api`

### Words.json Not Found

- The `words.json` file should be in the `backend/` directory
- Railway will include it in the deployment if it's in the repository

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `OPENAI_API_KEY` | Yes | Your OpenAI API key | `sk-...` |
| `ALLOWED_ORIGINS` | No | Comma-separated list of allowed CORS origins | `https://app.vercel.app,http://localhost:3000` |
| `PORT` | Auto | Railway sets this automatically | `8000` |

## Cost Considerations

- **Railway:** Free tier includes $5/month credit
- **OpenAI API:** Pay-as-you-go, embeddings are relatively inexpensive
- Monitor usage in both Railway and OpenAI dashboards

## Next Steps

- Set up custom domain for Railway (optional)
- Configure monitoring and alerts
- Set up database for persistent storage (if needed)
- Configure CI/CD for automatic deployments

---

**Need Help?** Check Railway's [documentation](https://docs.railway.app) or create an issue in the repository.
