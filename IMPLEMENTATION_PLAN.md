# Implementation Plan: Minimal Image Upload & Display

## Overview

This plan implements a minimal viable version of the image cropping app with just upload and display functionality. This allows for early testing of local development and Cloudflare deployment workflows.

## Phase 1: Minimal Flow (MVP)

### Features
- Upload image via drag-and-drop or file picker
- Display uploaded image
- Simple, clean UI
- No cropping functionality yet (added in later phases)

### Technical Implementation

#### Frontend (React + Vite)
- Single page app with image upload component
- HTML5 drag-and-drop API (no external libraries)
- File validation (image types, size limits)
- Image preview display

#### Backend (Cloudflare Pages Functions)
- Simple file upload endpoint
- Temporary storage for testing (no R2 yet)
- Basic health check endpoint

#### Project Structure
```
resize/
├── apps/
│   └── web/
│       ├── src/                    # React frontend
│       │   ├── App.tsx
│       │   ├── components/
│       │   │   └── ImageUpload.tsx
│       │   └── main.tsx
│       ├── functions/              # Cloudflare Pages Functions
│       │   └── api/
│       │       ├── healthz.ts
│       │       └── upload.ts
│       ├── index.html
│       ├── package.json
│       └── vite.config.ts
├── package.json                   # Root package.json
├── pnpm-workspace.yaml
└── INSTRUCTIONS.md
```

## Implementation Steps

### Step 1: Project Setup
1. Initialize monorepo structure
2. Setup Vite + React in `apps/web`
3. Configure TypeScript
4. Setup basic styling (CSS modules or inline styles)

### Step 2: Frontend Development
1. Create `ImageUpload` component with:
   - Drag-and-drop zone
   - File picker fallback
   - File validation
   - Preview display
2. Basic error handling and user feedback

### Step 3: Backend Development
1. Create health check endpoint (`/api/healthz`)
2. Create upload endpoint (`/api/upload`)
3. Basic file handling (validation, temporary storage)

### Step 4: Local Testing
1. Test frontend development server
2. Test Pages Functions locally with Wrangler
3. Test integration between frontend and backend

### Step 5: Deployment Setup
1. Create GitHub repository
2. Setup Cloudflare Pages project
3. Configure build settings
4. Test deployment pipeline

## File Specifications

### Key Components

#### `ImageUpload.tsx`
- Handle file input (both drag-drop and picker)
- Validate file types (jpg, png, webp)
- Display upload progress/status
- Show image preview after upload
- Simple error handling

#### `/api/upload.ts`
- Accept POST requests with multipart/form-data
- Validate file type and size
- Return success/error responses
- For MVP: just validate and return file info (no permanent storage)

#### `/api/healthz.ts`
- Simple health check endpoint
- Returns 200 OK with timestamp
- Used to verify backend is working

## Testing Strategy

### Local Testing
1. Start Vite dev server (`pnpm dev`)
2. Start Wrangler in parallel (`npx wrangler pages dev --proxy 5173`)
3. Test file upload flow
4. Verify API responses
5. Check error handling

### Deployment Testing
1. Push to GitHub
2. Verify automatic deployment on Cloudflare Pages
3. Test production build
4. Verify API endpoints work in production
5. Test with different file types and sizes

## Success Criteria

### MVP Ready When:
- [ ] User can upload an image (drag-drop or file picker)
- [ ] Image displays correctly after upload
- [ ] Basic error handling works (wrong file type, too large)
- [ ] App runs locally without issues
- [ ] App deploys successfully to Cloudflare Pages
- [ ] All API endpoints respond correctly in production

## Next Phases (Future)

### Phase 2: Basic Cropping
- Add predefined aspect ratios
- Implement crop rectangle overlay
- Basic crop functionality

### Phase 3: Advanced Features
- Multiple output formats
- Custom dimensions
- Download functionality
- Permanent storage (R2)

### Phase 4: Polish
- Better UI/UX
- Advanced image processing
- Performance optimizations

## Benefits of This Approach

1. **Early Validation**: Test deployment pipeline with minimal code
2. **Iterative Development**: Build confidence with each working step
3. **Simple Debugging**: Fewer moving parts to troubleshoot
4. **Clear Progress**: Visible functionality at each milestone
5. **Low Risk**: Easy to rollback or restart if needed

This plan prioritizes getting a working end-to-end flow as quickly as possible, allowing you to validate the development and deployment process before adding complexity.
