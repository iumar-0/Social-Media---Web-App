# 🚀 Social Media Backend (Full-stack web application
# Node.js + Express + Vanilla JS frontend Stack

A high-performance, scalable backend architecture for a modern social media platform. This system is designed with a **performance-first mindset**, focusing on efficient data handling, real-time updates, and secure authentication mechanisms.

---

## 🛠 Tech Stack

* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB (Mongoose ODM)
* **Authentication:** JWT + Google OAuth 2.0
* **Media Storage:** Cloudinary (Streaming-based)
* **Real-Time:** Socket.io
* **Architecture Pattern:** Modular Service-Oriented (MVC-S)

---

## 🏗 Backend Architecture

The system follows a **layered modular architecture** to ensure scalability and maintainability:

### 🔹 Core Layers

1. **Routing Layer**

   * Entry point for all API requests
   * Organizes endpoints into versioned modules

2. **Controller Layer**

   * Handles HTTP request/response lifecycle
   * Delegates logic to services

3. **Service Layer**

   * Core business logic
   * Database operations and optimizations

4. **Model Layer**

   * MongoDB schema definitions
   * Data validation and relationships

5. **Middleware Layer**

   * Authentication (JWT verification)
   * File handling (image uploads)
   * Request validation

6. **Utility Layer**

   * Performance-critical helpers
   * External integrations (Cloudinary, Email, Socket)

---

## 📂 Detailed Project Structure & File Map

### ⚙️ `/config` — Configuration Layer

Handles environment setup and third-party integrations.

* `auth.google.js` → Google OAuth 2.0 strategy
* `configcloudinary.js` → Cloudinary SDK configuration
* `db.js` → MongoDB connection using Mongoose

---

### 🎮 `/controller` — Request Handlers

* `accountController.js` → User authentication & account management
* `comment.controller.js` → Nested comment handling
* `profile.controller.js` → Profile data operations
* `userPostController.js` → Post creation & feed logic

---

### 🛡️ `/middleware` — Security & Processing

* `authMiddleware.js` → JWT validation & route protection
* `uploadImageMiddleware.js` → Handles multipart/form-data for media

---

### 💾 `/modal` — Database Schemas

* `account.modal.js` → User credentials & account data
* `comment.modal.js` → Recursive comment structure
* `follow.account.modal.js` → Follower/following relationships
* `like.modal.js` → Like tracking (duplicate prevention)
* `post.modal.js` → Post content & metadata
* `token.modal.js` → Token storage (refresh/verification)

---

### 🛣️ `/routes` — API Endpoints

* `auth.js` → Login, signup, OAuth
* `chat.router.js` → Messaging endpoints
* `comment.router.js` → Comment system APIs
* `mainRouter.js` → Root router (v1 aggregation)
* `postRouter.js` → Feed & post operations
* `user.profileRouter.js` → Profile routes

---

### 🧠 `/service` — Business Logic

* `accountService.js` → Password hashing & auth logic
* `comment.service.js` → Nested comments + pagination
* `postService.js` → Post CRUD operations
* `profile.account.service.js` → Profile aggregation

---

### 🛠️ `/utils` — Performance Utilities

* `cookieAssign.js` → Secure HTTP-only cookie handling
* `emailUtils.js` → Email/OTP sending logic
* `sidebar.profile.account.service.js` → Sidebar data optimization
* `socket.real.time.util.js` → Real-time event system
* `upload.image.cloud.js` → Streaming media upload engine

---

### 🚀 Root Files

* `.env` → Environment variables (ignored in Git)
* `app.js` → Express app configuration
* `package.json` → Dependencies & scripts

---

## 🔐 Authentication & Security System

### 1. JWT Authentication

* Token-based authentication for protected routes
* Middleware verifies token before granting access

### 2. Google OAuth Integration

* Social login using OAuth 2.0
* Configured in `auth.google.js`

### 3. Cookie-Based Session Handling

* Secure HTTP-only cookies via `cookieAssign.js`
* Prevents client-side token access (XSS protection)

### 4. Gateway Protection

* Private API key validation for internal communication

---

## ⚡ Performance-First Features

### 🚀 1. High-Speed Media Streaming (Cloudinary)

**Theory:**
Instead of storing files on the server, this system uses **Node.js streams** to send files directly to Cloudinary.

**Flow:**
Request → `uploadImageMiddleware` → `upload.image.cloud.js` → Cloudinary

**Benefits:**

* ❌ No disk storage usage
* ⚡ Zero I/O latency
* 📈 Scales under high traffic

---

### ⚡ 2. Real-Time Updates (Socket.io)

**Theory:**
Users receive live updates without refreshing.

**Flow:**
User Action → Service Layer → Socket Utility → Targeted Clients

**Features:**

* Real-time likes & comments
* Socket Rooms for targeted updates
* Efficient bandwidth usage

---

### 🧠 3. Advanced Comment System

* **Cursor-Based Pagination**

  * Uses `_id` and `$lt`
  * Prevents duplication issues

* **Recursive Nesting**

  * Supports threaded replies via `parentId`

* **Optimized Queries**

  * Indexed sorting for fast retrieval

---

### 🔒 4. Smart Data Integrity

* Like system prevents duplicates
* Indexed queries for O(1)-like access patterns
* Structured services reduce redundant DB calls

---

## 🚦 Example API Endpoints

| Method | Endpoint              | Description    |
| ------ | --------------------- | -------------- |
| GET    | `/v1/user/profile/setting` | Fetch Profile |
| POST   | `/v1/user/profile/image`  | Create profile Picture |
| DELETE | `/v1/user/profile/unfollow`     | Undo follow |

---

## ⚙️ Environment Variables

```bash
NODE_ENV=development
PORT=3000

DATABASE_LOCAL=mongodb://localhost:27017/socialMedia

JWTTOKENCODE=your_secret
APIGATEWAYPRIVATEKEY=your_key

CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/social-media-backend.git
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the project

```bash
npm run dev
```

---

## 📈 System Design Philosophy

This backend is built with:

* **Separation of concerns**
* **Performance-first engineering**
* **Scalable modular architecture**
* **Real-world backend patterns**

---

## 🧪 Project Status

⚠️ This project is currently **in progress**
Core backend systems are implemented, with future improvements planned:

* Notifications system
* Real-time chat expansion
* Redis caching layer
* API rate limiting

---

## 👨‍💻 Author

Developed as a backend-focused project to demonstrate:

* System design thinking
* API architecture
* Performance optimization
* Real-world backend engineering practices

---
