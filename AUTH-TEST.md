# Authentication Testing Guide

## What Was Fixed

### Problem
Frontend was not sending session cookies to the backend, causing all authenticated API calls to fail with 401 errors.

### Solution
Added `credentials: 'include'` to **all** fetch calls in frontend hooks:
- ✅ `useCapture.ts` - Text capture
- ✅ `useCaptureLink.ts` - Link capture
- ✅ `useCaptureFile.ts` - File upload
- ✅ `useItems.ts` - Fetch items
- ✅ `useSearch.ts` - Semantic search
- ✅ `AuthContext.tsx` - Already had it (login, signup, logout)

### Backend Configuration
- ✅ CORS configured with `credentials: true`
- ✅ Session middleware using Redis
- ✅ `requireAuth` middleware on protected routes
- ✅ Session cookie with 7-day expiration

---

## How to Test Auth End-to-End

### Step 1: Start All Services

**Terminal 1 - Docker (Postgres, Redis, LocalAI):**
```bash
docker-compose up -d
```

**Terminal 2 - Backend Server:**
```bash
npm run dev:server
```
Wait for: `🚀 Server running on http://localhost:3001`

**Terminal 3 - Worker:**
```bash
npm run dev:worker
```
Wait for: `Worker is running... Waiting for jobs...`

**Terminal 4 - Frontend:**
```bash
npm run dev:client
```
Wait for: `Local: http://localhost:5173`

---

### Step 2: Test Signup Flow

1. **Open Browser**: Navigate to http://localhost:5173
2. **Expect**: You should be redirected to `/login` (not authenticated)
3. **Click**: "Don't have an account? Sign up"
4. **Fill Form**:
   - Email: `test@example.com`
   - Password: `password123` (min 8 chars)
   - Name: `Test User` (optional)
5. **Submit**: Click "Sign Up"
6. **Expect**: 
   - Success! Redirected to home page (`/`)
   - Header shows: "Test User" or "test@example.com"
   - "Logout" button visible

**✅ If this works, auth signup is working!**

---

### Step 3: Test Protected Routes

**While logged in, test these features:**

#### A. Add Text Item
1. Click "+ Add Item" in header
2. Type: "Testing auth system"
3. Submit
4. **Expect**: Item appears in grid (no 401 error)

#### B. Add Link
1. Click "+ Add Item"
2. Switch to "Link" tab
3. Enter: `https://github.com`
4. Submit
5. **Expect**: Link item created (no 401 error)

#### C. Add File
1. Click "+ Add Item"
2. Switch to "File" tab
3. Upload an image or PDF
4. **Expect**: File uploaded (no 401 error)

#### D. View Items
1. Refresh the page
2. **Expect**: All your items still show (fetched successfully)

#### E. Search (if configured)
1. Type in search bar
2. Hit Enter
3. **Expect**: Search results (no 401 error)

**✅ If all these work, protected routes are working!**

---

### Step 4: Test Logout

1. Click "Logout" in header
2. **Expect**:
   - Redirected to `/login`
   - Header no longer shows user info
   - Session cleared

**✅ If redirected, logout is working!**

---

### Step 5: Test Login

1. On login page, enter:
   - Email: `test@example.com`
   - Password: `password123`
2. Click "Log In"
3. **Expect**:
   - Redirected to home page
   - All your items still there
   - User info in header

**✅ If this works, login is working!**

---

### Step 6: Test Session Persistence

1. While logged in, refresh the page (F5)
2. **Expect**: Still logged in (session persisted)
3. Close browser, reopen http://localhost:5173
4. **Expect**: Still logged in (cookie persisted)

**✅ If still logged in, session persistence is working!**

---

### Step 7: Test Settings

1. Click your email/name in header → "Settings"
2. **Update Profile**:
   - Change name to "Updated Name"
   - Click "Save Changes"
   - **Expect**: Success message, header updates
3. **Change Password**:
   - Current: `password123`
   - New: `newpassword123`
   - Confirm: `newpassword123`
   - Click "Change Password"
   - **Expect**: Success message
4. **Logout and Login** with new password
   - **Expect**: Can login with `newpassword123`

**✅ If all this works, settings are working!**

---

## Troubleshooting

### Issue: Redirected to /login after signup
**Check**: Server terminal for errors
**Fix**: Ensure `.env` has `SESSION_SECRET` set

### Issue: 401 Unauthorized on API calls
**Check**: Browser DevTools → Network → Request Headers
**Expected**: Should see `Cookie: connect.sid=...`
**Fix**: 
1. Clear browser cookies
2. Restart frontend: `npm run dev:client`
3. Try again

### Issue: CORS errors
**Check**: Server logs for CORS errors
**Fix**: Ensure `server/.env` has `CLIENT_URL=http://localhost:5173`

### Issue: Session not persisting
**Check**: Redis is running: `docker-compose ps`
**Fix**: Restart Redis: `docker-compose restart redis`

---

## Quick Verification Script

Run this in browser console (while on http://localhost:5173):

```javascript
// Test auth check
fetch('/api/auth/me', { credentials: 'include' })
  .then(r => r.json())
  .then(d => console.log('Auth:', d.success ? '✅ Logged in as ' + d.data.user.email : '❌ Not logged in'));

// Test protected route
fetch('/api/items', { credentials: 'include' })
  .then(r => r.json())
  .then(d => console.log('Items:', d.success ? `✅ Loaded ${d.data.items.length} items` : '❌ Failed: ' + d.error));
```

**Expected Output** (if logged in):
```
Auth: ✅ Logged in as test@example.com
Items: ✅ Loaded 3 items
```

---

## Summary of Auth Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (React)                                           │
│  - AuthContext provides user state                         │
│  - All fetch calls include credentials: 'include'          │
│  - Protected routes check user state                       │
└─────────────────┬───────────────────────────────────────────┘
                  │ HTTP + Session Cookie
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend (Express)                                          │
│  - CORS allows credentials from CLIENT_URL                 │
│  - express-session with Redis store                        │
│  - requireAuth middleware checks req.session.userId        │
│  - Protected routes: /api/capture, /api/items, /api/search │
└─────────────────┬───────────────────────────────────────────┘
                  │ Session Lookup
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Redis (Session Store)                                      │
│  - Stores session data (userId)                            │
│  - 7-day expiration                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Auth is NOW Fully Connected!

All frontend API calls will now send session cookies to the backend, allowing authentication to work seamlessly.

