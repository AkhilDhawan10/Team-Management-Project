# TeamFlow — Team Management App

A full-stack MERN application for project management, task assignment, and progress tracking with role-based access control.

## Tech Stack

- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT Auth
- **Frontend:** React 18, Vite, React Router, Axios
- **Styling:** Custom CSS dark theme with glassmorphism

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### 1. Clone & Install

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 2. Configure Environment

Create `server/.env`:
```env
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_secret_key_here
PORT=5000
NODE_ENV=development
```

### 3. Run Development

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend  
cd client
npm run dev
```

Frontend: http://localhost:3000  
Backend API: http://localhost:5000

## Features

- 🔐 JWT Authentication (Signup/Login)
- 👥 Project & team management
- ✅ Task creation, assignment & status tracking
- 📊 Dashboard with stats, progress bar, overdue tasks
- 🛡️ Role-based access (Admin/Member)
- 📱 Responsive design

## Role Permissions

| Action | Admin | Member |
|--------|-------|--------|
| Create projects | ✅ | ❌ |
| Delete projects | ✅ | ❌ |
| Add/remove members | ✅ | ❌ |
| Create tasks | ✅ | ❌ |
| Delete tasks | ✅ | ❌ |
| Update task status | ✅ | ✅ |
| View dashboard | ✅ | ✅ |

## Railway Deployment

1. Create a Railway account at [railway.app](https://railway.app)
2. Connect your GitHub repo
3. Add a new service from the repo
4. Set environment variables: `MONGO_URI`, `JWT_SECRET`, `NODE_ENV=production`
5. Set build command: `cd client && npm install && npm run build`
6. Set start command: `cd server && npm start`
7. Root directory: `/` (project root)

The backend serves the frontend build in production mode.
