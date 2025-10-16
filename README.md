# Chat App

A full-stack chat application with authentication, friend requests, messaging (text/files), profiles, themes, and WebSocket presence.

## Live

- Frontend: https://panchayat-frontend.onrender.com/signup
- Health (backend): GET /health (configure your Render base URL)

## Tech Stack

- Frontend: React + Vite, Zustand, TailwindCSS
- Backend: Node.js, Express, Socket.IO, MongoDB (Mongoose)
- Storage: Supabase Storage
- Email/OTP: Nodemailer (Gmail SMTP)

## Monorepo Layout

- `frontend/` – React app
- `backend/` – Express API + Socket.IO server

## Quick Start (Local)

1. Backend

```bash
cd backend
cp .env.example .env   # if you have one; otherwise create .env (see below)
npm install
npm run dev
```

2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open: http://localhost:5173

## Backend Environment Variables (`backend/.env`)

Set these before starting the backend:

```
PORT=3000
# Mongo
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
# JWT
JWT_SECRET=your_jwt_secret_here
# CORS
FRONTEND_URL=http://localhost:5173
# Email (Gmail SMTP)
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_app_password
# Supabase (Service Role is required in backend)
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_SERVICE_KEY=<service_role_key>
```

Notes:

- Use the Service Role key on the backend only (never expose to frontend). It bypasses Supabase RLS.
- `FRONTEND_URL` is used for CORS; multiple origins are supported in code.

## Frontend Environment (optional)

If you proxy API or configure base URLs, add a `.env` in `frontend/` as needed.

## Supabase Storage Setup

Create two buckets in your Supabase project:

- `profile-pics` – user avatars (public read optional)
- `chat-files` – chat attachments (public read optional)

Backend already uploads with paths like:

- Profile: `profile-pics/<userId>/profile-<timestamp>.jpg`
- Chat: `chat-files/<userId>/<filename>`

If you prefer anon key + RLS policies instead of Service Role, add storage policies that allow users to write to their own `<uid>/*` folder and (optionally) public read.

## CORS

Backend allows:

- `http://localhost:5173`
- `process.env.FRONTEND_URL` (production)

Cookies (JWT) are sent with `credentials: true`.

## Health Endpoint (for Render/UptimeRobot)

- `GET /health` → `{ status: "ok", uptime, timestamp }`
  Use this URL in your uptime monitor to keep the backend warm.

## File Upload Limits (recommended)

Enforce MIME type and size limits in upload handlers (examples exist in controllers):

- Profile images: allow `image/jpeg`, `image/png`, `image/webp`, max ~2MB
- Chat files: restrict types (images/pdf/text/etc.), set max size (e.g., 5–20MB)

## Scripts

Backend:

- `npm run dev` – start with nodemon
- `npm start` – start

Frontend:

- `npm run dev` – Vite dev
- `npm run build` – production build
- `npm run preview` – preview build

## License

MIT
