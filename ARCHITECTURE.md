# Loop AI - Architecture & Security Overview

## Overview
Loop AI is a Vite-powered React application with a secure, backend-first architecture for API key management. All sensitive operations are handled server-side only.

## Architecture

### Frontend (Vite on port 5173)
- **Runtime**: Vite v6.4.1 + React 19.2.1
- **Module Loading**: CDN-based importmap (aistudiocdn.com)
- **Port**: `http://localhost:5173` (development)
- **API Communication**: All requests go to `/api/gemini` endpoint
- **API Keys**: ZERO API keys stored or accessible in frontend code

### Backend API Server (Node.js Express on port 3001)
- **Runtime**: Node.js v24+ with Express.js
- **Port**: `http://localhost:3001` (development)
- **File**: `server/dev-api.js` (local development)
- **Production**: Vercel serverless function at `/api/gemini.ts`

### Production Environment (Vercel)
- **Frontend**: Built by Vite, served as static files
- **API**: Serverless functions in `/api` directory
- **Port**: Single domain (no port separation)
- **Environment**: Configured via Vercel dashboard

## API Security Model

### Frontend Communication Flow
```
React Component
    ↓ fetch()
Backend API (/api/gemini)
    ↓ 
Gemini Client (Google)
```

### What NEVER Reaches the Browser
- ❌ `GEMINI_API_KEY` - Kept only in server environment
- ❌ `VITE_FACEBOOK_APP_ID` - For future use, kept server-side
- ❌ `VITE_GOOGLE_CLIENT_ID` - For future use, kept server-side
- ❌ Any direct API calls to Google/Meta services

### What IS in Browser
- ✅ React components
- ✅ TypeScript types
- ✅ UI logic
- ✅ HTTP requests to `/api/gemini`
- ✅ Static assets (styles, fonts, images)

## Environment Variables

### Local Development (`.env.local` - Never committed)
```
GEMINI_API_KEY=AIzaSyDD3GjnMSiqPTaWpyr8MdZjK0XZqV2hlZY
VITE_FACEBOOK_APP_ID=542f32f2dcef396d2bd3e454c118125a
VITE_GOOGLE_CLIENT_ID=AIzaSyCWk2_ltf-jDW4mX9EkfuAt5nXnUCLs7i8
```

### Production (Vercel Dashboard)
```
GEMINI_API_KEY=<value>
VITE_FACEBOOK_APP_ID=<value>
VITE_GOOGLE_CLIENT_ID=<value>
```

## File Structure

```
loop-ai/
├── index.html                 # React entry point (NO API keys)
├── index.tsx                  # React app entry
├── App.tsx                    # Main React component
├── types.ts                   # TypeScript definitions
├── package.json               # Dependencies & scripts
├── vite.config.ts             # Vite configuration (port 5173)
├── vercel.json                # Production config
├── .gitignore                 # Protects *.local files
├── .env.local                 # Dev credentials (git-ignored)
│
├── api/
│   └── gemini.ts              # Vercel serverless function
│
├── server/
│   └── dev-api.js             # Local Express API server
│
├── services/
│   ├── geminiService.ts       # HTTP client wrapper (no keys!)
│   ├── mockMetaService.ts     # Meta/Facebook mock
│   ├── apiConfig.ts           # Deprecated - for reference only
│   └── [other services]
│
├── components/
│   ├── AssetSelector.tsx
│   ├── CampaignReview.tsx
│   ├── CreativePreview.tsx
│   └── PortfolioSelector.tsx
│
└── [other files]
```

## Running Locally

### Start Both Servers (Recommended)
```bash
npm run dev:both
```

### Start Servers Separately
Terminal 1 - Frontend (port 5173):
```bash
npm run dev
```

Terminal 2 - API Server (port 3001):
```bash
npm run dev:api
```

### Access the App
- Frontend: `http://localhost:5173`
- API Server: `http://localhost:3001`

## Building for Production

```bash
npm run build
```

This creates optimized, minified code in the `dist/` folder ready for Vercel deployment.

## Deployment to Vercel

1. Connect GitHub repository: `loopjoai/Loop-Ai`
2. Configure environment variables in Vercel dashboard:
   - `GEMINI_API_KEY`
   - `VITE_FACEBOOK_APP_ID`
   - `VITE_GOOGLE_CLIENT_ID`
3. Deploy: Vercel automatically runs `npm run build`
4. Serverless functions at `/api` handle all backend logic

## Key Security Principles

1. **Principle of Least Privilege**
   - Browser has zero API credentials
   - Backend has complete API access
   - Each layer accesses only what it needs

2. **Defense in Depth**
   - Environment variables stored separately per environment
   - No hardcoded secrets anywhere
   - `.gitignore` prevents accidental commits
   - Vercel environment secrets encryption

3. **API Key Rotation Ready**
   - Update `.env.local` (development)
   - Update Vercel dashboard (production)
   - No code changes needed

4. **Zero Trust Frontend**
   - Treat browser code as public
   - All sensitive operations server-side
   - All API calls authenticated at server

## Service Integration

### Gemini API
- **Operations**: Business names, logos, product images, ad concepts, targeting
- **Implementation**: `server/dev-api.js` and `api/gemini.ts`
- **Client Usage**: `services/geminiService.ts` makes safe HTTP calls

### Meta/Facebook
- **Status**: Mock implementation for future integration
- **Location**: `services/mockMetaService.ts`
- **Plan**: Integrate real API when backend routes are ready

## Error Handling

### API Error Types
- **403 Forbidden**: Missing/invalid GEMINI_API_KEY
- **429 Rate Limit**: Too many requests, retry later
- **500 Server Error**: Check backend logs

### User-Facing Messages
- Safe, generic error messages
- No internal error details exposed
- Proper HTTP status codes returned

## Testing

### Local Testing
```bash
# Terminal 1
npm run dev

# Terminal 2
npm run dev:api

# Terminal 3 - Test API
curl -X POST http://localhost:3001/api/gemini \
  -H "Content-Type: application/json" \
  -d '{"operation":"generateBusinessNames","niche":"Technology"}'
```

### Vercel Preview
- Automatic preview deployments for PR reviews
- Same environment configuration as production
- Test before merging to main

## Troubleshooting

### App Won't Load
1. Check Vite is running: `npm run dev` on port 5173
2. Verify no port conflicts: `netstat -ano | grep 5173`
3. Clear browser cache and reload

### API Requests Failing
1. Check API server: `npm run dev:api` on port 3001
2. Verify `.env.local` has `GEMINI_API_KEY`
3. Check API response in browser DevTools > Network

### API Key Errors
1. Verify key exists in `.env.local` (development)
2. Verify key in Vercel dashboard (production)
3. Test API directly: `curl http://localhost:3001/api/gemini`

## References

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Vercel Functions Documentation](https://vercel.com/docs/functions)
- [Google Generative AI Documentation](https://ai.google.dev/)
