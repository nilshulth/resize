# Development & Deployment Instructions

## Prerequisites

- **Node.js** (v18 or later)
- **pnpm** (`npm install -g pnpm`)
- **Git**
- **Cloudflare account** (free tier is sufficient)

## 1. Local Development Setup

### Initial Setup

1. **Clone and setup the project:**
   ```bash
   cd /Users/nilshulth/resize
   pnpm install
   ```

2. **Navigate to the web app:**
   ```bash
   cd apps/web
   ```

### Running Locally

You need to run **two processes** simultaneously for full functionality:

#### Process 1: Frontend Development Server
```bash
# In terminal 1
cd apps/web
pnpm dev
```
- Starts Vite dev server with hot reload
- Frontend available at: `http://localhost:5173`
- Hot reload for React components

#### Process 2: Backend Functions Server
```bash
# In terminal 2
cd apps/web
npx wrangler pages dev --proxy 5173
```
- Starts Cloudflare Pages Functions locally
- Full app available at: `http://127.0.0.1:8788`
- API endpoints available at: `http://127.0.0.1:8788/api/*`

### Testing Locally

1. **Open your browser to:** `http://127.0.0.1:8788`
2. **Test the upload functionality:**
   - Drag and drop an image file
   - Or click to select a file
   - Verify the image displays
3. **Test API endpoints:**
   - Health check: `http://127.0.0.1:8788/api/healthz`
   - Should return "ok" with 200 status

### Common Local Development Issues

#### Port conflicts:
```bash
# If port 5173 is busy, Vite will auto-increment
# Update the wrangler command to match:
npx wrangler pages dev --proxy 5174  # or whatever port Vite chose
```

#### Wrangler login issues:
```bash
npx wrangler login
# Follow the browser authentication flow
```

#### Clear Pages Functions cache:
```bash
# If functions aren't updating:
npx wrangler pages dev --proxy 5173 --live-reload
```

## 2. GitHub Setup

### Create Repository

1. **Initialize git (if not already done):**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: minimal image upload app"
   ```

2. **Create GitHub repository:**
   - Go to [github.com](https://github.com) → New Repository
   - Name: `resize` (or your preferred name)
   - **Don't** initialize with README (you already have files)
   - Create repository

3. **Push to GitHub:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/resize.git
   git branch -M main
   git push -u origin main
   ```

## 3. Cloudflare Pages Deployment

### Option A: Automatic Git Integration (Recommended)

1. **Login to Cloudflare Dashboard:**
   - Go to [dash.cloudflare.com](https://dash.cloudflare.com)
   - Navigate to **Pages**

2. **Create a new Pages project:**
   - Click **"Create a project"**
   - Choose **"Connect to Git"**
   - Select your GitHub repository (`resize`)

3. **Configure build settings:**
   ```
   Framework preset: None
   Root directory: apps/web
   Build command: pnpm install && pnpm build
   Build output directory: dist
   ```

4. **Environment variables (if needed):**
   - Click **"Add variable"** for any environment variables
   - For MVP, none are required

5. **Deploy:**
   - Click **"Save and Deploy"**
   - First deployment takes 2-5 minutes
   - You'll get a URL like: `https://resize-xyz.pages.dev`

### Option B: Manual CLI Deployment

1. **Install and login to Wrangler:**
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. **Build the project:**
   ```bash
   cd apps/web
   pnpm build
   ```

3. **Deploy manually:**
   ```bash
   npx wrangler pages deploy ./dist --project-name=resize-app
   ```

### Deployment Verification

1. **Check your deployment:**
   - Visit your Cloudflare Pages URL
   - Test image upload functionality
   - Check API health: `https://your-app.pages.dev/api/healthz`

2. **View deployment logs:**
   - In Cloudflare Dashboard → Pages → Your Project
   - Click on latest deployment for logs

## 4. Development Workflow

### Making Changes

1. **Make your changes locally**
2. **Test locally using both servers**
3. **Commit and push:**
   ```bash
   git add .
   git commit -m "Description of changes"
   git push
   ```
4. **Automatic deployment** happens via GitHub integration
5. **Test production deployment**

### Rollback if Needed

1. **In Cloudflare Dashboard:**
   - Go to Pages → Your Project → Deployments
   - Click **"Manage"** → **"Rollback"** on a previous deployment

2. **Or revert Git commit:**
   ```bash
   git revert HEAD
   git push
   ```

## 5. Project Structure

```
resize/
├── apps/web/                    # Main application
│   ├── src/                     # React frontend source
│   │   ├── App.tsx             # Main app component
│   │   ├── components/         # React components
│   │   │   └── ImageUpload.tsx # Image upload component
│   │   └── main.tsx            # App entry point
│   ├── functions/              # Cloudflare Pages Functions (API)
│   │   └── api/
│   │       ├── healthz.ts      # Health check endpoint
│   │       └── upload.ts       # File upload endpoint
│   ├── public/                 # Static assets
│   ├── index.html              # HTML template
│   ├── package.json            # Web app dependencies
│   └── vite.config.ts          # Vite configuration
├── package.json                # Root package.json
├── pnpm-workspace.yaml         # pnpm monorepo config
└── INSTRUCTIONS.md             # This file
```

## 6. Troubleshooting

### Build Failures

**Check build logs:**
- In Cloudflare Dashboard → Pages → Deployments → Click failed deployment

**Common issues:**
```bash
# Missing dependencies
pnpm install

# TypeScript errors
pnpm type-check

# Build locally to debug
cd apps/web
pnpm build
```

### API Not Working

**Local development:**
```bash
# Check if wrangler is running
ps aux | grep wrangler

# Restart wrangler with verbose logging
npx wrangler pages dev --proxy 5173 --local --verbose
```

**Production:**
- Check Cloudflare Dashboard → Pages → Functions → Logs
- Verify function files are in correct directory structure

### File Upload Issues

**Check browser console** for JavaScript errors

**Verify file types** are supported (jpg, png, webp)

**Check file size limits** in your upload component

### Performance Issues

**Large files:**
- Implement client-side image compression
- Add upload progress indicators
- Set reasonable file size limits

**Slow builds:**
- Check if `node_modules` is being uploaded (should be in `.gitignore`)
- Optimize bundle size if needed

## 7. Next Steps

After successful deployment:

1. **Add monitoring** (Cloudflare provides basic analytics)
2. **Setup custom domain** (optional)
3. **Add more features** as per implementation plan
4. **Setup staging environment** using Pages Preview Deployments

## Quick Reference

### Essential Commands
```bash
# Local development
cd apps/web && pnpm dev                              # Frontend
cd apps/web && npx wrangler pages dev --proxy 5173  # Backend

# Build and deploy
cd apps/web && pnpm build                           # Build locally
git add . && git commit -m "msg" && git push       # Deploy via Git

# Debug
npx wrangler pages dev --proxy 5173 --verbose      # Verbose logging
npx wrangler pages deployment list                 # List deployments
```

### Important URLs
- **Local development:** `http://127.0.0.1:8788`
- **Production:** Your Cloudflare Pages URL
- **Cloudflare Dashboard:** [dash.cloudflare.com](https://dash.cloudflare.com)
- **GitHub:** [github.com](https://github.com)
