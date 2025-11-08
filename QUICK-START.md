# 🚀 Quick Start Guide - Project Synapse

Complete step-by-step instructions to run and test the application.

---

## 📋 Prerequisites Check

Before starting, make sure you have:
- ✅ **Docker Desktop** installed and running
- ✅ **Node.js** installed (v18+)
- ✅ **npm** installed

**Check Docker:**
```bash
docker --version
```

**Check Node:**
```bash
node --version
npm --version
```

---

## 🎯 Step 1: Start Docker Services

Open **Terminal 1** (PowerShell or Command Prompt):

```bash
# Navigate to project root
cd C:\secondbrain

# Start Docker services (Postgres, Redis, LocalAI)
docker-compose up -d
```

**Wait for:** All services to start (about 30 seconds)

**Verify services are running:**
```bash
docker-compose ps
```

You should see:
```
NAME                STATUS
synapse-postgres    Up
synapse-redis       Up
synapse-localai     Up
```

✅ **Leave this terminal open** (Docker services run in background)

---

## 🗄️ Step 2: Setup Database (First Time Only)

If this is your **first time** running the project:

```bash
# Navigate to server directory
cd server

# Run database migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Go back to root
cd ..
```

**Expected output:**
```
✔ Applied migration: xxxxxx
✔ Generated Prisma Client
```

✅ **Skip this step** if you've already run migrations before.

---

## 🔧 Step 3: Verify Environment Files

Make sure these files exist with correct content:

### `server/.env`
```bash
DATABASE_URL="postgresql://synapse:synapse_dev_password@localhost:5432/synapse_db"
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3001
NODE_ENV=development
SESSION_SECRET=dev-secret-change-in-production
CLIENT_URL=http://localhost:5173
OPENAI_API_KEY=not-needed
OPENAI_API_BASE=http://localhost:8080/v1
```

### `worker/.env`
```bash
DATABASE_URL="postgresql://synapse:synapse_dev_password@localhost:5432/synapse_db"
REDIS_HOST=localhost
REDIS_PORT=6379
OPENAI_API_KEY=not-needed
OPENAI_API_BASE=http://localhost:8080/v1
```

### `client/.env`
```bash
VITE_API_URL=http://localhost:3001
```

**If files are missing**, create them with the content above.

---

## 🖥️ Step 4: Start Backend Server

Open **Terminal 2** (new terminal window):

```bash
# Navigate to project root
cd C:\secondbrain

# Start the server
npm run dev:server
```

**Wait for:**
```
🚀 Server running on http://localhost:3001
Environment: development
CORS: http://localhost:5173
```

✅ **Leave this terminal running** - Don't close it!

**If you see errors:**
- Check that Docker services are running (`docker-compose ps`)
- Check that `server/.env` exists and has correct values
- Make sure port 3001 is not already in use

---

## ⚙️ Step 5: Start Worker Service

Open **Terminal 3** (new terminal window):

```bash
# Navigate to project root
cd C:\secondbrain

# Start the worker
npm run dev:worker
```

**Wait for:**
```
Worker is running...
Waiting for jobs...
```

✅ **Leave this terminal running** - Don't close it!

**The worker processes:**
- Text summarization
- Link metadata extraction
- File processing
- Embedding generation

---

## 🎨 Step 6: Start Frontend

Open **Terminal 4** (new terminal window):

```bash
# Navigate to project root
cd C:\secondbrain

# Start the frontend
npm run dev:client
```

**Wait for:**
```
VITE v5.x.x ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

✅ **Leave this terminal running** - Don't close it!

---

## 🌐 Step 7: Open Browser & Test

### 7.1 Open the Application

1. Open your browser
2. Navigate to: **http://localhost:5173**
3. You should see the **Login page**

---

### 7.2 Create Your First Account

1. Click **"Don't have an account? Sign up"**
2. Fill in the form:
   - **Email:** `test@example.com`
   - **Password:** `password123` (minimum 8 characters)
   - **Name:** `Test User` (optional)
3. Click **"Sign Up"**

**Expected:**
- ✅ Success message
- ✅ Redirected to home page (`/`)
- ✅ Header shows your email/name
- ✅ "Logout" button visible

**If you see an error:**
- Check Terminal 2 (server) for error messages
- Make sure Redis is running: `docker-compose ps`
- Check browser console (F12) for errors

---

### 7.3 Test Adding Text Item

1. Click **"+ Add Item"** button in header
2. Type: `"This is my first note in Synapse"`
3. Click **"Save"** or press `Ctrl+Enter`

**Expected:**
- ✅ Modal closes
- ✅ Item appears in the grid
- ✅ Status shows "Processing..." then "Completed"
- ✅ Summary and tags appear (after worker processes it)

**Check Terminal 3 (worker)** - You should see:
```
[Worker] Processing item: clx...
[Worker] Item processed successfully
```

---

### 7.4 Test Adding Link

1. Click **"+ Add Item"**
2. Click **"Link"** tab
3. Enter URL: `https://github.com`
4. Click **"Save"**

**Expected:**
- ✅ Link item created
- ✅ Preview image/icon appears (if available)
- ✅ "Visit" link works
- ✅ Metadata extracted (title, description)

---

### 7.5 Test Adding File

1. Click **"+ Add Item"**
2. Click **"File"** tab
3. Drag & drop an image or PDF, or click to browse
4. Wait for upload progress
5. Click **"Save"**

**Expected:**
- ✅ File uploaded successfully
- ✅ Preview appears (for images)
- ✅ File item created in grid

---

### 7.6 Test Viewing Items

1. Scroll through the memory grid
2. Click on any item card to see details
3. Refresh the page (F5)

**Expected:**
- ✅ All your items still visible
- ✅ Still logged in (session persisted)
- ✅ Items load correctly

---

### 7.7 Test Search (if LocalAI is configured)

1. Type in the search bar: `"first note"`
2. Press **Enter**

**Expected:**
- ✅ Search results appear
- ✅ Items matching your query are shown
- ✅ Relevance scores displayed

**Note:** Search requires LocalAI to be running and configured. If it doesn't work, check:
- `docker-compose ps` - LocalAI should be "Up"
- Terminal 2 (server) for LocalAI connection errors

---

### 7.8 Test Settings

1. Click your **email/name** in the header
2. You'll be redirected to **Settings page**

**Test Profile Update:**
1. Change **Name** to: `"Updated Name"`
2. Click **"Save Changes"**
3. **Expected:** Success message, header updates

**Test Password Change:**
1. Click **"Password"** tab
2. Enter:
   - Current: `password123`
   - New: `newpassword123`
   - Confirm: `newpassword123`
3. Click **"Change Password"**
4. **Expected:** Success message
5. **Test:** Logout and login with new password

---

### 7.9 Test Logout & Login

1. Click **"Logout"** in header
2. **Expected:** Redirected to `/login`
3. Enter credentials:
   - Email: `test@example.com`
   - Password: `newpassword123` (or `password123` if you didn't change it)
4. Click **"Log In"**
5. **Expected:** Redirected to home, all items still there

---

## ✅ Success Checklist

If all these work, your app is fully functional:

- [x] Docker services running
- [x] Server starts without errors
- [x] Worker starts without errors
- [x] Frontend loads in browser
- [x] Can sign up new account
- [x] Can login
- [x] Can add text item
- [x] Can add link
- [x] Can add file
- [x] Can view all items
- [x] Session persists after refresh
- [x] Can search (if LocalAI configured)
- [x] Can update settings
- [x] Can logout and login again

---

## 🛑 Stopping the Application

### Stop Development Servers

In each terminal (Terminal 2, 3, 4):
- Press **Ctrl+C**
- Wait for process to stop

### Stop Docker Services

In Terminal 1:
```bash
docker-compose down
```

**To stop AND remove all data:**
```bash
docker-compose down -v
```

---

## 🐛 Troubleshooting

### Issue: Server won't start

**Error:** `EADDRINUSE: address already in use :::3001`

**Fix:**
```bash
# Find process using port 3001
netstat -ano | findstr :3001

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

---

### Issue: Database connection error

**Error:** `Can't reach database server`

**Fix:**
```bash
# Check Docker services
docker-compose ps

# Restart Postgres
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

---

### Issue: Redis connection error

**Error:** `Redis Client Error`

**Fix:**
```bash
# Check Redis is running
docker-compose ps redis

# Restart Redis
docker-compose restart redis

# Test Redis connection
docker exec -it synapse-redis redis-cli ping
# Should return: PONG
```

---

### Issue: Frontend shows blank page

**Fix:**
1. Open browser DevTools (F12)
2. Check **Console** tab for errors
3. Check **Network** tab for failed requests
4. Clear browser cache: `Ctrl+Shift+Delete`
5. Hard refresh: `Ctrl+Shift+R`

---

### Issue: 401 Unauthorized errors

**Symptom:** Can't add items, see 401 errors

**Fix:**
1. Check browser DevTools → Network → Request Headers
2. Should see: `Cookie: connect.sid=...`
3. If missing:
   - Clear cookies for localhost:5173
   - Restart frontend: `npm run dev:client`
   - Try login again

---

### Issue: Items not processing

**Symptom:** Items stuck in "Processing..." status

**Fix:**
1. Check Terminal 3 (worker) for errors
2. Check Terminal 2 (server) for errors
3. Verify Redis is running: `docker-compose ps`
4. Restart worker: `Ctrl+C` then `npm run dev:worker`

---

### Issue: LocalAI not working

**Symptom:** Search doesn't work, embeddings not generated

**Fix:**
```bash
# Check LocalAI is running
docker-compose ps localai

# Check LocalAI logs
docker-compose logs localai

# Restart LocalAI
docker-compose restart localai

# Test LocalAI endpoint
curl http://localhost:8080/health
```

**Note:** LocalAI may take 1-2 minutes to fully start. Check logs for "ready" message.

---

## 📊 Monitoring

### Check All Services Status

```bash
# Docker services
docker-compose ps

# Check logs
docker-compose logs -f
```

### Check Server Logs

Terminal 2 (server) shows:
- API requests
- Errors
- Database queries

### Check Worker Logs

Terminal 3 (worker) shows:
- Job processing
- AI operations
- Errors

---

## 🎉 You're All Set!

Your Project Synapse is now running and ready to use!

**Quick Reference:**
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **Health Check:** http://localhost:3001/health
- **LocalAI:** http://localhost:8080

**Need Help?**
- See `AUTH-TEST.md` for detailed auth testing
- See `AUTH-CONNECTION.md` for technical details
- See `README.md` for project overview

Happy building! 🚀

