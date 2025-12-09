# 🚀 Loop AI - Setup & Deployment Guide

## ✅ Quick Start (Local Development)

### Prerequisites
- Node.js 24+ and npm 11+
- `.env.local` file with API keys (ask team for current keys)

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Create `.env.local` in project root:
```
GEMINI_API_KEY=your_key_here
VITE_FACEBOOK_APP_ID=your_key_here
VITE_GOOGLE_CLIENT_ID=your_key_here
```

**⚠️ Important**: `.env.local` is git-ignored and should NEVER be committed.

### 3. Run Development Servers

**Option A: Both servers together**
```bash
npm run dev:both
```

**Option B: Separate terminals**

Terminal 1 - Frontend (Vite):
```bash
npm run dev
```
Opens at: `http://localhost:5173`

Terminal 2 - API Server:
```bash
npm run dev:api
```
Running at: `http://localhost:3001`

### 4. Open in Browser
Visit `http://localhost:5173` and start using the app!

---

## 🔧 Build for Production

```bash
npm run build
```

Creates optimized code in `dist/` folder.

Preview production build locally:
```bash
npm run preview
```

---

## 🌐 Deploy to Vercel

### First Time Setup
1. Connect GitHub repository to Vercel
2. Go to **Project Settings → Environment Variables**
3. Add these variables:
   - `GEMINI_API_KEY` - Your Google Gemini API key
   - `VITE_FACEBOOK_APP_ID` - Your Meta App ID
   - `VITE_GOOGLE_CLIENT_ID` - Your Google OAuth Client ID

### Deploy
```bash
git push origin main
```
Vercel automatically deploys on every push to main branch.

### Check Deployment Status
Visit your Vercel project dashboard to see:
- Build logs
- Deployment status
- Environment variables (masked for security)

---

## 📋 What Changed (Refactoring Summary)

### Before Issues
- ❌ API keys stored in HTML (security risk)
- ❌ process.env used in frontend
- ❌ Vite running on port 3000 (non-standard)
- ❌ API key values visible in browser

### After Fixes
- ✅ All API keys server-side only
- ✅ All frontend requests go through `/api/gemini`
- ✅ Vite on standard port 5173
- ✅ Zero API exposure to browser
- ✅ Production-ready security

---

## 🔐 Security Checklist

- ✅ API keys only in `.env.local` and Vercel dashboard
- ✅ `.env.local` in `.gitignore` (never committed)
- ✅ Frontend has ZERO API credentials
- ✅ All Gemini calls routed through `/api/gemini`
- ✅ Vercel serverless functions handle authentication
- ✅ No process.env in browser code
- ✅ No hardcoded secrets anywhere

---

## 📂 Project Structure

```
loop-ai/
├── Frontend Code (React/Vite)
│   ├── index.html - Entry point (no API keys)
│   ├── App.tsx - Main component
│   └── components/ - UI components
│
├── Backend API
│   ├── server/dev-api.js - Local dev server (port 3001)
│   └── api/gemini.ts - Vercel serverless function
│
├── Services
│   ├── geminiService.ts - HTTP client (calls /api/gemini)
│   └── mockMetaService.ts - Meta/Facebook mock
│
└── Config Files
    ├── vite.config.ts - Vite config (port 5173)
    ├── vercel.json - Vercel deployment config
    ├── package.json - Dependencies & scripts
    └── .env.local - API keys (git-ignored)
```

---

## 🐛 Troubleshooting

### "Unable to connect to localhost:5173"
- Verify Vite is running: `npm run dev`
- Check no other app is using port 5173
- Clear browser cache

### "API requests failing with 403"
- Check `.env.local` has `GEMINI_API_KEY`
- Verify API server is running: `npm run dev:api`
- API credentials might be expired

### "VITE_FACEBOOK_APP_ID not defined"
- This is normal - it's only used when Facebook integration is enabled
- Check console warnings - should say "Not configured"

### "Failed to build on Vercel"
- Check Environment Variables in Vercel dashboard
- Verify all 3 keys are set correctly
- Check build logs for specific errors

---

## 📚 Documentation

- **ARCHITECTURE.md** - Detailed technical architecture
- **SECURITY_REFACTOR.md** - Original security improvements
- **README.md** - Project overview

---

## 🚀 Next Steps

1. **Test locally** - Run `npm run dev:both` and verify everything works
2. **Check API security** - Open DevTools → Network tab, verify no API keys in requests
3. **Deploy to Vercel** - Push to main branch and monitor deployment
4. **Monitor production** - Check Vercel dashboard for errors

---

## 💬 Getting Help

If something isn't working:
1. Check **Troubleshooting** section above
2. Review **ARCHITECTURE.md** for technical details
3. Check Vercel deployment logs for production issues
4. Verify `.env.local` has correct values (development)

---

## ✨ Key Commands

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run dev` | Start Vite frontend (5173) |
| `npm run dev:api` | Start API server (3001) |
| `npm run dev:both` | Start both servers |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

---

**Made with ❤️ for secure, scalable AI applications**
