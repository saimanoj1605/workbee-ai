# WorkBee - AI-Powered Local Work Platform

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Express](https://img.shields.io/badge/Express-5-green.svg)](https://expressjs.com/)

## 🚀 Vision

WorkBee is a production-grade, AI-powered local workforce platform that connects students with local businesses for gig work. Built with security, scalability, and user trust as core principles.

## 📋 Table of Contents

- [Problem Statement](#problem-statement)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Security Features](#security-features)
- [Deployment](#deployment)
- [Folder Structure](#folder-structure)
- [Contributing](#contributing)

## 🎯 Problem Statement

Local businesses struggle to find reliable temporary workers, while students seek flexible earning opportunities. Existing platforms lack:
- **Trust & Safety**: Fake accounts, scam jobs, payment fraud
- **Verification**: No proper student/business verification
- **Accountability**: No proof of work or attendance tracking
- **Real-time Collaboration**: Poor communication tools

WorkBee solves these with:
- ✅ Firebase OTP Authentication
- ✅ Student & Business Verification (College Email, GST/PAN)
- ✅ QR-based Attendance with Geo-Validation
- ✅ Work Proof Upload System
- ✅ Escrow Payment Protection
- ✅ AI-powered Gig Matching

## ✨ Features

### 🔐 Security & Trust
- **OTP Authentication** via Firebase
- **Student Verification** with college email validation
- **Business Verification** with GST/PAN validation
- **Device Fingerprinting** for fraud detection
- **Security Logging** for audit trails
- **Rate Limiting** & DDoS protection

### 📱 Core Platform
- **Gig Marketplace** with AI-powered matching
- **Real-time Chat** using Socket.IO
- **QR Attendance System** with GPS validation
- **Work Proof Upload** with Cloudinary
- **Escrow Payments** via Razorpay
- **Review & Rating System**

### 📊 Admin Dashboard
- **User Management**
- **Verification Approval**
- **Report Moderation**
- **Analytics & Insights**

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16 | React Framework |
| TypeScript | 5.7 | Type Safety |
| Tailwind CSS | 4 | Styling |
| shadcn/ui | 4 | UI Components |
| Zustand | 5 | State Management |
| Socket.IO Client | 4 | Real-time Communication |
| Recharts | 3 | Data Visualization |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20+ | Runtime |
| Express | 5 | Web Framework |
| TypeScript | 5.7 | Type Safety |
| Prisma | 7.8 | ORM |
| PostgreSQL | 15+ | Database |
| Socket.IO | 4 | WebSocket Server |
| Firebase Admin | 13 | Authentication |
| Razorpay | 2.9 | Payment Processing |
| Cloudinary | 2.10 | File Storage |
| OpenAI | 6.39 | AI Features |

### DevOps & Infrastructure
| Service | Purpose |
|---------|---------|
| Vercel | Frontend Hosting |
| Render | Backend Hosting |
| Neon | PostgreSQL Database |
| Cloudinary | Media Storage |
| PostHog | Analytics |

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (Next.js)     │◄──►│   (Express)     │◄──►│  (PostgreSQL)   │
│                 │    │                 │    │    (Neon)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Real-time      │    │   External      │    │    Storage      │
│  (Socket.IO)    │    │   Services      │    │   (Cloudinary)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ and npm
- PostgreSQL database (or Neon account)
- Firebase project (for OTP auth)
- Cloudinary account (for file storage)
- Razorpay account (for payments)

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure your environment variables
# Required: DATABASE_URL, JWT_SECRET, Firebase credentials

# Generate Prisma client and push schema
npm run setup

# Start development server
npm run dev
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Configure your environment variables
# Required: NEXT_PUBLIC_API_URL

# Start development server
npm run dev
```

## 📚 API Documentation

### Authentication Endpoints
```
POST   /api/auth/signup          - Create new account
POST   /api/auth/login           - User login
POST   /api/auth/verify-otp      - Verify Firebase OTP
```

### Gig Endpoints
```
GET    /api/gigs                 - List all gigs
POST   /api/gigs                 - Create gig (Business)
POST   /api/gigs/:id/apply       - Apply to gig (Student)
PATCH  /api/gigs/:id/applications/:appId - Update application
```

### Verification Endpoints
```
POST   /api/verification/students/verify     - Submit student verification
GET    /api/verification/students/status     - Get verification status
POST   /api/verification/businesses/verify   - Submit business verification
GET    /api/verification/admin/stats         - Get verification stats (Admin)
```

### Report Endpoints
```
POST   /api/reports                - Create report
GET    /api/reports/my-reports     - Get user's reports
POST   /api/reports/admin/resolve  - Resolve report (Admin)
```

### Payment Endpoints
```
POST   /api/payments/create-order  - Create Razorpay order
POST   /api/payments/verify        - Verify payment signature
POST   /api/payments/webhook       - Razorpay webhook
```

## 🔒 Security Features

### Authentication & Authorization
- Firebase OTP for phone verification
- JWT-based session management
- Role-based access control (Student, Business, Admin)

### Data Protection
- Helmet.js for security headers
- XSS protection with xss-clean
- HTTP Parameter Pollution protection
- Rate limiting per IP

### Fraud Prevention
- Device fingerprinting
- QR attendance with GPS validation
- Work proof verification
- Security event logging

## 🚀 Deployment

### Frontend (Vercel)
1. Push code to GitHub
2. Import project to Vercel
3. Configure environment variables
4. Deploy

### Backend (Render)
1. Create new Web Service
2. Connect GitHub repository
3. Set build command: `npm run build`
4. Set start command: `npm start`
5. Configure environment variables

### Database (Neon)
1. Create new PostgreSQL database
2. Copy connection string
3. Set as DATABASE_URL in backend

## 📁 Folder Structure

```
workbee/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   ├── controllers/       # Request handlers
│   │   ├── middleware/        # Express middleware
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   ├── types/             # TypeScript types
│   │   ├── utils/             # Utility functions
│   │   ├── validators/        # Input validation
│   │   ├── app.ts             # Express app setup
│   │   └── server.ts          # Server entry point
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── app/               # Next.js app directory
│   │   ├── components/        # React components
│   │   ├── hooks/             # Custom hooks
│   │   ├── lib/               # Utilities
│   │   ├── services/          # API services
│   │   ├── store/             # State management
│   │   ├── types/             # TypeScript types
│   │   └── middleware.ts      # Next.js middleware
│   ├── package.json
│   └── tsconfig.json
│
└── docs/                       # Documentation
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Guidelines
- Use conventional commits: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`
- Write clear, descriptive commit messages
- Reference issues when applicable

## 📄 License

This project is licensed under the ISC License.

## 👥 Team

Built with ❤️ by the WorkBee Team

---

**Production Stack Summary:**
- Frontend: Next.js 16 + TypeScript + Tailwind CSS
- Backend: Express 5 + TypeScript + Prisma ORM
- Database: PostgreSQL (Neon)
- Auth: Firebase + JWT
- Payments: Razorpay
- Storage: Cloudinary
- Hosting: Vercel + Render
- Analytics: PostHog