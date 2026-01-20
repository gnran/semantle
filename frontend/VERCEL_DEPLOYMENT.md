# Vercel Deployment Guide

## Setting Environment Variables in Vercel

Since you're deploying to Vercel, you need to set environment variables in the Vercel dashboard. The local `.env` file is only for development.

### Step 1: Add Environment Variable in Vercel Dashboard

1. Go to your Vercel project dashboard: https://vercel.com/dashboard
2. Select your **Semantle** project
3. Go to **Settings** → **Environment Variables**
4. Click **"Add New"** or use the **"Raw Editor"**

### Step 2: Add Required Variables

Add the following environment variables:

#### Required:
- **Name:** `VITE_CONTRACT_ADDRESS`
- **Value:** `0xD931F408FDce4cf34637a6873a190eA482558E86` (your contract address)
- **Environments:** Select all:
  - ✅ Production
  - ✅ Preview
  - ✅ Development

#### Optional (if using Railway backend):
- **Name:** `VITE_API_URL`
- **Value:** `https://your-backend.railway.app` (your Railway backend URL)
- **Environments:** Select all:
  - ✅ Production
  - ✅ Preview
  - ✅ Development

### Step 3: Redeploy

After adding the environment variables:

1. Go to **Deployments** tab
2. Click the **"⋯"** (three dots) menu on your latest deployment
3. Click **"Redeploy"**
4. Or push a new commit to trigger a redeploy

**Important:** Vercel only injects environment variables during the build process, so you must redeploy after adding/changing them.

### Step 4: Verify

After redeployment, check that the environment variable is being used:

1. Open your deployed app
2. Open browser DevTools (F12)
3. Go to Console
4. The contract should now be configured and transactions should work

## Quick Reference

Your current contract address:
```
VITE_CONTRACT_ADDRESS=0xD931F408FDce4cf34637a6873a190eA482558E86
```

## Troubleshooting

### "Contract not configured" error persists
- ✅ Make sure you added `VITE_CONTRACT_ADDRESS` in Vercel dashboard
- ✅ Make sure you selected all environments (Production, Preview, Development)
- ✅ Make sure you **redeployed** after adding the variable
- ✅ Check that the variable name starts with `VITE_` (required for Vite)

### Environment variable not showing up
- Vercel caches builds - try a hard redeploy
- Check the variable name is exactly `VITE_CONTRACT_ADDRESS` (case-sensitive)
- Make sure there are no extra spaces in the variable name or value

### Local development still works
- Your local `.env` file will continue to work for local development
- Vercel environment variables only affect the deployed version
