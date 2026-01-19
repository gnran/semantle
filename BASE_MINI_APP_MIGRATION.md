# Base Mini App Migration Guide

This document outlines the steps completed to migrate Semantle to Base Mini Apps and the remaining steps you need to complete.

## ✅ Completed Steps

### 1. MiniApp SDK Installation
- ✅ Installed `@farcaster/miniapp-sdk` package in the frontend

### 2. App Display Integration
- ✅ Added `sdk.actions.ready()` call in `App.jsx` using `useEffect` hook
- This hides the loading splash screen and displays your app when it's ready

### 3. Manifest File Structure
- ✅ Created manifest file at `frontend/public/.well-known/farcaster.json`
- Vite automatically serves files from the `public` directory, so this will be available at `https://your-domain.com/.well-known/farcaster.json`

### 4. Embed Metadata
- ✅ Added `fc:miniapp` metadata to `index.html` for rich embeds when your app is shared

## 🔧 Next Steps (Required)

### Step 1: Update Manifest URLs

You need to update all placeholder URLs in the manifest file with your actual deployment URLs:

**File:** `frontend/public/.well-known/farcaster.json`

Replace `https://your-app-domain.com` with your actual domain (e.g., `https://semantle.vercel.app`)

**Required URLs to update:**
- `homeUrl` - Your app's main URL
- `iconUrl` - Icon image (recommended: 512x512px PNG)
- `splashImageUrl` - Splash screen image (recommended: 1200x675px)
- `splashBackgroundColor` - Background color for splash screen (currently set to `#000000`)
- `webhookUrl` - Webhook endpoint (optional, can be removed if not needed)
- `screenshotUrls` - Array of screenshot URLs (at least 1, recommended 3)
- `heroImageUrl` - Hero/OG image for sharing
- `ogImageUrl` - Open Graph image for social sharing

**Example:**
```json
{
  "miniapp": {
    "homeUrl": "https://semantle.vercel.app",
    "iconUrl": "https://semantle.vercel.app/icon.png",
    "splashImageUrl": "https://semantle.vercel.app/splash.png",
    ...
  }
}
```

### Step 2: Update Embed Metadata URLs

**File:** `frontend/index.html`

Update the `fc:miniapp` meta tag with your actual URLs:
- `imageUrl` - Embed image URL
- `url` - Your app URL
- `splashImageUrl` - Splash screen URL
- `splashBackgroundColor` - Background color (should match manifest)

### Step 3: Create Required Images

You need to create and host the following images:

1. **Icon** (`icon.png`) - 512x512px PNG, square icon for your app
2. **Splash Image** (`splash.png`) - 1200x675px, shown while app loads
3. **Screenshots** (3 recommended) - Showcase your app's features
4. **Hero/OG Image** (`hero.png` or `og-image.png`) - 1200x630px for social sharing
5. **Embed Image** (`embed-image.png`) - For rich embeds when shared

Place these images in your `frontend/public` directory so they're accessible at your domain.

### Step 4: Deploy to Production

1. **Deploy your frontend** (e.g., to Vercel)
2. **Verify the manifest is accessible** at:
   ```
   https://your-domain.com/.well-known/farcaster.json
   ```
3. Make sure all image URLs are accessible

### Step 5: Create Account Association Credentials

This step verifies ownership of your app domain:

1. **Ensure your app is live** with the manifest file accessible
2. **Navigate to** [Base Build Account Association Tool](https://build.base.org/account-association)
3. **Paste your domain** in the "App URL" field (e.g., `https://semantle.vercel.app`)
4. **Click "Submit"**
5. **Click "Verify"** and follow the instructions
6. **Copy the generated `accountAssociation` fields**:
   - `header`
   - `payload`
   - `signature`
7. **Update the manifest file** `frontend/public/.well-known/farcaster.json` with these credentials:

```json
{
  "accountAssociation": {
    "header": "eyJmaWQiOjkxNTIsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgwMGVmNzkwRGQ3OTkzQTM1ZkQ4NDdDMDUzRURkQUU5NDBEMDU1NTk2In0",
    "payload": "eyJkb21haW4iOiJhcHAuZXhhbXBsZS5jb20ifQ",
    "signature": "0x..." // This will be a very long hex string when generated
  },
  "miniapp": {...}
}
```

**Note:** The signature will be much longer when signing with your Base Account (as mentioned in the docs).

### Step 6: Preview Your App

1. **Use the Base Build Preview tool** to validate your app:
   - Navigate to [Base Build Preview](https://build.base.org/preview)
   - Add your app URL
   - View embeds and click the launch button to verify the app launches
   - Use the "Account association" tab to verify credentials
   - Use the "Metadata" tab to see metadata and identify missing fields

### Step 7: Publish Your App

To publish your app, create a post in the Base app with your app's URL. Users will be able to discover and launch your mini app from within Base.

## 📝 Notes

- The manifest file is served from the `public` directory, which Vite automatically includes in the build
- All image URLs must be publicly accessible
- The `webhookUrl` is optional - you can remove it from the manifest if you don't need webhooks
- Make sure your `splashBackgroundColor` matches your app's theme
- The `noindex` field is set to `false` by default - set it to `true` if you don't want search engines to index your app

## 🔗 Resources

- [Base Mini Apps Documentation](https://docs.base.org/mini-apps)
- [Base Build Account Association Tool](https://build.base.org/account-association)
- [Base Build Preview Tool](https://build.base.org/preview)
