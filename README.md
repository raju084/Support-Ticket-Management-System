# Support Ticket Management System

A full-featured mini helpdesk system built with **Node.js**, **Express**, **MongoDB**, and **Next.js**. Users can raise support tickets and administrators can manage and resolve them.

---

## 🚀 Live Demo

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| Health Check | http://localhost:5000/health |

**Demo Accounts** (after seeding):
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@support.com | Admin@123 |
| User | alice@example.com | User@123 |
| User | bob@example.com | User@123 |

---

## 📋 Features

### User Features
- ✅ Register & Login with JWT authentication
- ✅ Create, view, edit, delete support tickets
- ✅ Track ticket status in real time
- ✅ Add comments to tickets
- ✅ View personal activity history
- ✅ Dashboard with ticket statistics

### Admin Features
- ✅ View all tickets with filtering & search
- ✅ Update ticket status and priority inline
- ✅ Assign tickets to team members
- ✅ Respond to any ticket (with internal notes)
- ✅ Manage users (activate/deactivate)
- ✅ Dashboard with charts & analytics
- ✅ Full activity log

### Technical Features
- ✅ Event-driven architecture (Node.js EventEmitter)
- ✅ Activity logging for all events
- ✅ Pagination, sorting & filtering
- ✅ Rate limiting & security headers
- ✅ Input validation & error handling
- ✅ Role-based access control (RBAC)
- ✅ Refresh token rotation
- ✅ Docker support
- ✅ Automated API tests (Jest + Supertest)
- ✅ Winston logging

---

## 🛠 Technology Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 20 |
| Backend Framework | Express.js |
| Language | JavaScript (ES6+) |
| Database | MongoDB + Mongoose |
| Authentication | JWT (access + refresh tokens) |
| Frontend | Next.js 14 (Pages Router) |
| UI Styling | Tailwind CSS |
| Data Fetching | TanStack Query (React Query) |
| Charts | Recharts |
| Validation | express-validator |
| Security | Helmet, bcryptjs, rate-limiting |
| Logging | Winston |
| Testing | Jest + Supertest |
| Containerization | Docker + Docker Compose |

---

## 📁 Project Structure

```
Support Ticket Management System/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   │   ├── auth.controller.js
│   │   │   ├── ticket.controller.js
│   │   │   ├── comment.controller.js
│   │   │   ├── admin.controller.js
│   │   │   └── activity.controller.js
│   │   ├── models/           # Mongoose schemas
│   │   │   ├── user.model.js
│   │   │   ├── ticket.model.js
│   │   │   ├── comment.model.js
│   │   │   └── activity.model.js
│   │   ├── routes/           # Express routers
│   │   ├── middleware/       # Auth, validation, error
│   │   ├── events/           # EventBus (event-driven)
│   │   │   └── eventBus.js
│   │   └── utils/            # Helpers, logger, validators
│   ├── __tests__/            # Jest test files
│   ├── logs/                 # Winston log files
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/            # Next.js pages
│   │   │   ├── login.jsx
│   │   │   ├── register.jsx
│   │   │   ├── dashboard/
│   │   │   ├── tickets/
│   │   │   ├── admin/
│   │   │   └── activity/
│   │   ├── components/       # Reusable UI components
│   │   ├── context/          # React Context (Auth)
│   │   └── lib/              # API client & utilities
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Option 1: Run with Docker (Recommended)

```bash
# Clone & start all services
docker compose up --build

# Seed database (in a new terminal)
docker exec stms_backend node src/utils/seeder.js
```

### Option 2: Manual Setup

#### 1. Backend

```bash
cd backend

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secrets

# Start development server
npm run dev

# (Optional) Seed database with sample data
npm run seed
```

#### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Set up environment
cp .env.local.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:5000

# Start development server
npm run dev
```

App available at **http://localhost:3000**

---

## ☁️ Cloud Deployment (Render + MongoDB Atlas + Vercel)

This project includes `render.yaml` (backend Blueprint) and `frontend/vercel.json` (frontend Vercel config).

### 1. Database (MongoDB Atlas)
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a database user and allow network access (`0.0.0.0/0` for cloud hosts).
3. Copy your connection string (`mongodb+srv://...`).

### 2. Backend (Render)
1. Push this repository to GitHub.
2. In [Render](https://render.com), choose **New + → Blueprint** and connect your GitHub repository (`render.yaml` is auto-detected).
3. Set the required environment variables:
   - `MONGODB_URI`: your MongoDB Atlas connection string
   - `FRONTEND_URL`: your Vercel URL (e.g. `https://your-app.vercel.app`)
4. (Optional) Seed demo data once deployed from Render Shell:
   ```bash
   npm run seed
   ```

### 3. Frontend (Vercel)
```bash
cd frontend
vercel login
vercel --prod
```
Set `NEXT_PUBLIC_API_URL` in Vercel Project Settings (Environment Variables) to your deployed Render backend URL (e.g. `https://support-ticket-backend.onrender.com`), then redeploy with `vercel --prod`.

---

## 🧪 Running Tests

```bash
cd backend
npm test
```

Tests cover:
- Auth registration & login flows
- Token validation
- Ticket CRUD operations
- Role-based access control
- Comment management
- Admin-only endpoints

---

## 📡 API Documentation

### Base URL: `http://localhost:5000/api`

All protected routes require: `Authorization: Bearer <accessToken>`

---

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | ❌ | Register new user |
| POST | `/auth/login` | ❌ | Login & get tokens |
| POST | `/auth/refresh` | ❌ | Refresh access token |
| POST | `/auth/logout` | ✅ | Logout & invalidate token |
| GET | `/auth/me` | ✅ | Get current user profile |
| PUT | `/auth/me` | ✅ | Update profile |
| PUT | `/auth/change-password` | ✅ | Change password |

**Register Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Secret@123"
}
```

**Login Response:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "name": "John", "email": "...", "role": "user" },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

### Tickets (User)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tickets` | Get user's tickets (paginated, filterable) |
| POST | `/tickets` | Create a new ticket |
| GET | `/tickets/:id` | Get ticket details |
| PUT | `/tickets/:id` | Update ticket (title, description, category) |
| DELETE | `/tickets/:id` | Delete ticket (open status only) |
| GET | `/tickets/stats/me` | User's ticket statistics |

**Query Params (GET /tickets):**
```
?page=1&limit=10&status=open&priority=high&category=technical&search=keyword&sortBy=createdAt&sortOrder=desc
```

**Create Ticket:**
```json
{
  "title": "Cannot login to account",
  "description": "I keep getting invalid credentials error...",
  "category": "account",
  "priority": "high",
  "tags": ["login", "urgent"]
}
```

---

### Comments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tickets/:id/comments` | Get all comments for ticket |
| POST | `/tickets/:id/comments` | Add comment |
| PUT | `/tickets/:id/comments/:commentId` | Update comment |
| DELETE | `/tickets/:id/comments/:commentId` | Delete comment |

**Add Comment:**
```json
{
  "content": "I have tried clearing cache but it still doesn't work.",
  "isInternal": false
}
```

---

### Admin Routes (Admin only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/dashboard` | Dashboard statistics |
| GET | `/admin/tickets` | All tickets (paginated, filterable) |
| PATCH | `/admin/tickets/:id/status` | Update ticket status |
| PATCH | `/admin/tickets/:id/priority` | Update ticket priority |
| PATCH | `/admin/tickets/:id/assign` | Assign ticket |
| GET | `/admin/users` | Get all users |
| PATCH | `/admin/users/:id/toggle-status` | Activate/deactivate user |

**Update Status:**
```json
{
  "status": "in-progress",
  "note": "Assigned to our technical team."
}
```

---

### Activity Log

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/activities` | Activity log (user: own; admin: all) |
| GET | `/activities/ticket/:ticketId` | Activity for specific ticket |

---

## 🗄️ Database Design

### Users Collection
```
_id, name, email, password (hashed), role (user|admin),
isActive, avatar, lastLogin, refreshToken, timestamps
```

### Tickets Collection
```
_id, title, description, category, priority, status,
createdBy (ref: User), assignedTo (ref: User),
tags[], attachments[], resolvedAt, closedAt,
statusHistory[{ status, changedBy, changedAt, note }],
timestamps
```

**Indexes:** `createdBy + status`, `status + priority`, `text (title + description)`, `createdAt`

### Comments Collection
```
_id, ticket (ref: Ticket), author (ref: User),
content, isInternal, editedAt, timestamps
```

**Index:** `ticket + createdAt`

### Activities Collection
```
_id, event (enum), actor (ref: User), ticket (ref: Ticket),
metadata (Mixed), description, timestamps
```

**Events tracked:**
`TICKET_CREATED`, `TICKET_UPDATED`, `TICKET_DELETED`, `STATUS_CHANGED`, `PRIORITY_CHANGED`, `COMMENT_ADDED`, `COMMENT_UPDATED`, `COMMENT_DELETED`, `TICKET_RESOLVED`, `TICKET_CLOSED`, `TICKET_ASSIGNED`, `USER_REGISTERED`

---

## ⚡ Event-Driven Architecture

The system uses Node.js's built-in `EventEmitter` to implement a lightweight event bus:

```
User Action → Controller → eventBus.emit(EVENT, data)
                                        ↓
                             Event Handler registered with eventBus.on()
                                        ↓
                             Activity.create() → persisted to MongoDB
                                        ↓  
                             logger.info() → Winston log
                                        ↓
                             [Future] Email notification, webhooks, etc.
```

**Events flow:**
- `STATUS_CHANGED` → automatically chains into `TICKET_RESOLVED` or `TICKET_CLOSED`
- All events log to `Activity` collection (queryable via `/api/activities`)
- All events log to `logs/combined.log`

---

## 🔐 Security

- **Passwords:** bcryptjs with 12 salt rounds
- **Tokens:** Short-lived JWT (7d) + refresh token rotation (30d)
- **Headers:** Helmet.js (XSS, CSRF, CSP)
- **Rate Limiting:** 100 requests / 15 minutes per IP
- **CORS:** Restricted to frontend origin
- **Input Validation:** express-validator on all endpoints
- **Data Access:** Users can only access their own tickets

---

## 🏗 Implementation Decisions

1. **MongoDB over PostgreSQL** – Document model fits tickets (variable fields, embedded status history) better than relational schema.

2. **EventEmitter over message queue** – Lightweight, synchronous logging is sufficient for this scale; can be swapped for Redis Pub/Sub or RabbitMQ later.

3. **Next.js Pages Router** – Better compatibility with the team's React.js familiarity and simpler data fetching pattern.

4. **TanStack Query** – Server state management with caching, refetching, and optimistic updates out of the box.

5. **Refresh token rotation** – Security best practice; tokens are stored in DB for server-side revocation.

6. **Status History embedded** – Keeps all history in one document fetch; avoids N+1 queries.

---

## 📄 License

MIT
