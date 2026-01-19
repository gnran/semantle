# Quick Auth Authentication Setup

This document describes the Quick Auth authentication implementation for the Semantle Base Mini App.

## ✅ Completed Implementation

### Frontend Changes

1. **App.jsx** - Added authentication flow:
   - Shows loading screen while authenticating
   - Uses `sdk.quickAuth.getToken()` to get JWT token
   - Verifies token with backend via `/api/auth` endpoint
   - Calls `sdk.actions.ready()` after authentication completes
   - Handles authentication errors gracefully

2. **App.css** - Added loading screen styles:
   - Loading spinner animation
   - Error message display
   - Retry button styling

### Backend Changes

1. **requirements.txt** - Added dependencies:
   - `pyjwt[crypto]==2.8.0` - For JWT verification
   - `cryptography>=41.0.0` - For cryptographic operations

2. **main.py** - Added authentication endpoint:
   - `/api/auth` - GET endpoint that verifies JWT tokens
   - Uses PyJWKClient to fetch public keys from Farcaster's JWKS endpoint
   - Verifies token signature, expiration, issuer, and audience
   - Returns user's FID (Farcaster ID) upon successful authentication

## 🔧 Configuration Required

### Environment Variables

You need to set the following environment variable in your backend deployment (Railway):

**APP_DOMAIN** - Your mini app's deployment domain (without protocol)
- For production: `semantle.vercel.app`
- For local development: `localhost:3000` (or your local domain)

**Example (Railway):**
```
APP_DOMAIN=semantle.vercel.app
```

**Optional:**
- `VERIFY_AUDIENCE` - Set to `"false"` to disable audience verification during development (default: `"true"`)

### Install Dependencies

After updating `requirements.txt`, install the new dependencies:

```bash
cd backend
pip install -r requirements.txt
```

Or if using a virtual environment:

```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

## 🔄 Authentication Flow

1. **User opens app** → Loading screen appears
2. **Frontend calls** `sdk.quickAuth.getToken()` → User signs with their wallet
3. **Frontend sends token** to `/api/auth` endpoint with `Authorization: Bearer <token>` header
4. **Backend verifies token**:
   - Fetches public key from Farcaster's JWKS endpoint
   - Verifies signature, expiration, issuer, and audience
   - Returns user's FID if valid
5. **Frontend receives user data** → Calls `sdk.actions.ready()` → App displays

## 📝 Notes

- The JWT token expires after 1 hour (as per Base documentation)
- The token is stored in memory (not persisted) - users will need to re-authenticate on page refresh
- The loading screen is shown during the entire authentication process
- If authentication fails, an error message is shown with a retry button

## 🐛 Troubleshooting

### "JWT verification service unavailable"
- Check that `pyjwt` and `cryptography` packages are installed
- Verify network connectivity to Farcaster's JWKS endpoint

### "Invalid token" errors
- Ensure `APP_DOMAIN` matches your actual deployment domain exactly
- Check that the token hasn't expired (tokens expire after 1 hour)
- For development, you can set `VERIFY_AUDIENCE=false` to disable audience verification

### Authentication fails silently
- Check browser console for errors
- Verify backend is accessible and `/api/auth` endpoint is working
- Ensure CORS is properly configured for your frontend domain

## 🔗 Resources

- [Base Mini Apps Authentication Docs](https://docs.base.org/mini-apps/core-concepts/authentication)
- [JWT.io](https://jwt.io/) - For debugging JWT tokens
- [PyJWT Documentation](https://pyjwt.readthedocs.io/)
