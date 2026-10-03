<p align="center">
  <img src="https://raw.githubusercontent.com/Satishyadav-2006/MediConnect/main/MediConnect/MediConnect_Logo.png" alt="MediConnect Logo" width="420">
</p>

<h1 align="center">MediConnect</h1>

<p align="center">
  <strong>A Healthcare Professional Networking Platform</strong>
</p>

<p align="center">
  Connect • Learn • Grow
</p>

# MediConnect – A Healthcare Professional Networking Platform

MediConnect is a healthcare-focused professional networking web application designed to provide a centralized platform for healthcare professionals, students, healthcare organizations, and administrators.

The platform brings professional networking, career opportunities, knowledge sharing, communication, events, mentorship, and organizational interaction together within a single web-based system.

MediConnect is developed as a full-stack academic software project using React and TypeScript for the frontend, FastAPI and Python for the backend, and MongoDB for data storage.

---

## Overview

Healthcare professionals and students often use different platforms for professional networking, career opportunities, research-related information, communication, and events. MediConnect aims to provide a specialized environment focused on the healthcare domain.

The system provides role-based functionality for:

- Healthcare Professionals
- Healthcare Students
- Healthcare Organizations
- Administrators

The platform includes professional verification, user profiles, organization profiles, networking, posts, jobs, internships, events, research, mentorship, messaging, notifications, search, and administrative management.

---

## Objectives

The major objectives of MediConnect are:

- Provide a dedicated professional networking platform for the healthcare domain.
- Enable healthcare professionals and students to create and manage professional profiles.
- Provide a professional verification mechanism.
- Allow users to discover and connect with other healthcare professionals.
- Provide a professional feed for sharing and interacting with posts.
- Provide dedicated job and internship opportunities.
- Support healthcare-related events.
- Support research and professional knowledge sharing.
- Provide mentorship-related interactions.
- Enable communication through messaging.
- Provide notifications for relevant platform activities.
- Provide search functionality for professionals, organizations, opportunities, and resources.
- Provide organization-related functionality for healthcare institutions.
- Implement role-based access control.
- Provide administrative management for verification and platform operations.
- Maintain secure authentication and protected backend resources.

---

## Major Features

### 1. User Registration and Authentication

- User registration
- Email verification using OTP
- Login
- Logout
- JWT-based authentication
- Access and refresh tokens
- Forgot password
- Password reset
- Password hashing
- Failed-login tracking
- Temporary account locking
- Password history protection

### 2. Professional Verification

Healthcare professionals can submit professional information for verification.

The verification workflow maintains the professional verification status and verification history through authorized administrative processing.

### 3. User Profiles

Users can create and manage professional profiles containing relevant personal and professional information.

### 4. Healthcare Organization Profiles

Healthcare organizations can maintain organization profiles and use the platform for professional interaction and recruitment-related activities.

### 5. Professional Networking

Users can discover and connect with other healthcare professionals through the networking module.

### 6. Healthcare Feed

The feed allows users to:

- Create professional posts
- View posts
- Like posts
- Comment on posts
- Interact with professional content

### 7. Jobs

Healthcare organizations can publish job opportunities.

Eligible users can:

- Browse available jobs
- View job information
- Apply for opportunities

### 8. Internships

The internship module provides dedicated internship opportunities for eligible users.

### 9. Events

Users can discover and participate in healthcare-related professional events.

### 10. Research and Knowledge Sharing

The platform provides functionality for sharing research-related and professional information.

### 11. Mentorship

MediConnect supports mentor-mentee interactions for professional guidance and development.

### 12. Messaging

Authenticated users can communicate through the platform using messaging functionality.

WebSocket-based communication is implemented for supported real-time operations.

### 13. Notifications

Users receive notifications related to relevant platform activities.

Firebase Cloud Messaging is integrated to support push-notification functionality.

### 14. Search

Users can search for:

- Healthcare professionals
- Organizations
- Opportunities
- Other available platform resources

### 15. Administrative Management

Administrators can manage:

- Professional verification
- Platform operations
- Content-related activities
- User-related administrative functions

### 16. Role-Based Access Control

Access to platform functionality is controlled according to the authenticated user's role and permissions.

---

## User Roles

| Role | Main Responsibilities |
|------|------------------------|
| Healthcare Professional | Manage profile, networking, posts, research, events, mentorship, messaging, jobs and internships |
| Student | Manage profile, networking, professional content, events, mentorship, and eligible opportunities |
| Healthcare Organization | Manage organization profile, networking, recruitment, jobs, internships, events, and professional content |
| Administrator | Manage verification, users, content, and platform operations |

---

## Technology Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- Framer Motion

### Backend

- Python
- FastAPI
- Uvicorn

### Database

- MongoDB
- MongoDB Atlas

### Authentication and Security

- JSON Web Token (JWT)
- Password Hashing
- Email OTP Verification
- Role-Based Access Control (RBAC)
- Access and Refresh Tokens
- Account Locking
- Password History Protection

### Real-Time Communication

- WebSocket

### External Services

- Cloudinary – Media management
- Firebase Cloud Messaging – Push notifications
- SMTP – Email verification and password recovery

---

## System Architecture

MediConnect follows a layered full-stack architecture.

```text
                    ┌──────────────────────────┐
                    │      User / Browser      │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │ React + TypeScript + Vite│
                    │       Frontend           │
                    └────────────┬─────────────┘
                                 │
                       REST APIs / WebSocket
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │ Python + FastAPI          │
                    │      Backend              │
                    └────────────┬─────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
      ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
      │   MongoDB    │   │   Cloudinary  │   │     FCM      │
      │ MongoDB Atlas│   │ Media Service │   │ Notifications│
      └──────────────┘   └──────────────┘   └──────────────┘
                                 │
                                 ▼
                         ┌──────────────┐
                         │     SMTP     │
                         │ Email Service│
                         └──────────────┘

The frontend communicates with the FastAPI backend through REST APIs. WebSocket communication is used for supported real-time functionality. MongoDB stores application data, while external services support media management, notifications, and email-related operations.

Project Structure
MediConnect_Project/
│
├── medicontact/
│
├── frontend/
│   └── src/
│       ├── api/
│       ├── components/
│       ├── contexts/
│       ├── features/
│       ├── hooks/
│       ├── layouts/
│       ├── routes/
│       ├── services/
│       ├── types/
│       ├── utils/
│       └── validators/
│
└── backend/
    └── app/
        ├── api/
        ├── core/
        ├── emails/
        ├── models/
        ├── repositories/
        ├── schemas/
        ├── services/
        ├── storage/
        ├── tasks/
        ├── utils/
        ├── validators/
        ├── websocket/
        └── main.py
Authentication Flow

MediConnect uses a multi-stage authentication and verification process.

User Registration
       │
       ▼
Email OTP Verification
       │
       ▼
Professional Verification
       │
       ▼
Administrative Verification
       │
       ▼
Active Account
       │
       ▼
Login
       │
       ▼
JWT Access / Refresh Tokens
       │
       ▼
Protected Platform Resources

Email verification and professional verification are treated as separate processes.

API Architecture

The backend provides REST APIs for the major application modules.

Major API categories include:

Authentication APIs
User APIs
Jobs APIs
Connection APIs
Post APIs
Notification APIs
Event APIs
Organization APIs
Comment APIs
Search APIs
Message APIs
Device APIs
Settings APIs
Internship APIs
Mentorship APIs
Mentor APIs
Research APIs
Achievement APIs
Analytics APIs
Admin APIs
Upload APIs
Channel APIs
Hashtag APIs
Recommendation APIs
Health APIs

WebSocket endpoints are also used for supported real-time communication.

Representative API Endpoints
Method	Endpoint	Purpose
POST	/api/v1/auth/register	User registration
POST	/api/v1/auth/login	User login
POST	/api/v1/auth/verify-email	Email verification
POST	/api/v1/auth/forgot-password	Password recovery
POST	/api/v1/auth/reset-password	Password reset
GET	/api/v1/auth/me	Current authenticated user
POST	/api/v1/auth/logout	Logout
GET	/api/v1/users	User information
GET	/api/v1/search	Search functionality
POST	/api/v1/posts	Create post
GET	/api/v1/posts/feed	Retrieve feed
GET	/api/v1/posts/trending	Retrieve trending posts
GET	/api/v1/jobs	Retrieve jobs
POST	/api/v1/jobs	Create job
GET	/api/v1/events	Retrieve events
GET	/api/v1/events/upcoming	Retrieve upcoming events
GET	/api/v1/organizations	Retrieve organizations
GET	/api/v1/connections/suggestions	Connection suggestions
GET	/api/v1/notifications	Retrieve notifications
GET	/api/v1/notifications/unread-count	Retrieve unread notification count
GET	/api/v1/messages/conversations	Retrieve conversations
GET	/api/v1/settings	Retrieve settings
GET	/api/v1/admin/dashboard	Administrative dashboard
GET	/api/v1/admin/users	Administrative user management
WebSocket	/api/v1/ws/presence	Presence communication
WebSocket	/api/v1/ws/chat	Real-time chat communication
WebSocket	/api/v1/ws/notifications	Real-time notification communication
Database

MongoDB is used as the primary database and MongoDB Atlas provides the cloud-hosted database environment.

The database stores information related to:

User accounts
Professional verification
Profiles
Organizations
Posts
Connections
Jobs
Internships
Events
Research
Mentorship
Messages
Notifications
Other platform data

The frontend does not directly access the database. Database operations are handled through the backend.

External Service Integration
Cloudinary

Cloudinary is used for supported media-management operations.

Firebase Cloud Messaging

Firebase Cloud Messaging is used to support push notifications.

SMTP

SMTP is used for email-related functionality, including:

Email verification
Password recovery

External services are accessed through the backend and configured using environment variables.

Security

MediConnect implements several security mechanisms, including:

Password hashing
JWT-based authentication
Access and refresh tokens
Email verification
Role-based authorization
Failed-login tracking
Temporary account locking
Password reset token expiration
Password history protection
Protected backend endpoints
Environment-based secret management

Sensitive credentials and secrets are kept in environment configuration rather than being hard-coded into the application source code.

Environment Configuration

Create the required environment configuration files for the frontend and backend.

Typical backend configuration includes:

JWT_SECRET_KEY=your_secret_key
JWT_REFRESH_SECRET_KEY=your_refresh_secret
JWT_ALGORITHM=HS256

ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

MONGODB_URL=your_mongodb_connection_string

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email
SMTP_PASSWORD=your_app_password

FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json

FRONTEND_URL=http://localhost:5173

Do not commit real passwords, API keys, database credentials, JWT secrets, Firebase credentials, or other private configuration values to GitHub.

Installation and Setup
1. Clone the Repository
git clone <your-repository-url>
cd MediConnect_Project
2. Backend Setup

Navigate to the backend directory:

cd backend

Create a Python virtual environment:

python -m venv .venv

Activate the virtual environment on Windows:

.venv\Scripts\activate

Install the required dependencies:

pip install -r requirements.txt

Configure the backend environment variables before starting the application.

Start the FastAPI backend:

python -m uvicorn app.main:app --reload

The backend runs on the local development server.

3. Frontend Setup

Open a new terminal and navigate to the frontend directory:

cd frontend

Install the frontend dependencies:

npm install

Start the React/Vite development server:

npm run dev

The frontend communicates with the backend through the configured API endpoint.

API Documentation

FastAPI provides API documentation through the generated OpenAPI interface.

After starting the backend, the documentation can be accessed through:

http://localhost:8000/docs

The exact host and port may vary depending on the configured development environment.

Testing

MediConnect was tested progressively during development across frontend, backend, authentication, authorization, database operations, API integration, and real-time functionality.

Functional Module Testing
Module	Test Cases	Passed	Failed
Authentication	52	52	0
Professional Verification	10	10	0
Profiles	16	16	0
Networking	22	22	0
Feed	21	21	0
Jobs	15	15	0
Internships	19	19	0
Events	19	19	0
Research	13	13	0
Mentorship	18	18	0
Messaging	12	12	0
Notifications	11	11	0
Total	228	228	0
API Testing

The project includes testing across 26 major API categories.

The observed API testing results recorded in the project were successful across the tested categories.

Authentication Testing

A detailed authentication and security test suite containing 61 test cases was executed, with all recorded test cases passing.

Response-Time Testing

API response-time measurements were also performed for tested endpoints.

The recorded average response times were:

HTTP Status	Average Response Time
200	38.27 ms
422	26.58 ms
401	17.05 ms
Development Methodology

MediConnect follows an Iterative and Incremental Software Development Approach.

The development process included:

Requirement Analysis
System Design
Module Development
API and Backend Development
Frontend Development
Integration
Testing and Debugging
Iterative Improvement

Individual modules were developed, integrated, tested, and refined progressively.

Current Limitations

The current version of MediConnect has the following limitations:

The current implementation is primarily web-based.
A dedicated native mobile application is not part of the current implementation.
Some functionality depends on external services such as Cloudinary, Firebase Cloud Messaging, and SMTP.
Professional verification depends on the submitted professional information and the administrative review process.
The project is primarily developed and tested as an academic software project.
Large-scale production deployment would require additional infrastructure, monitoring, security hardening, and scalability testing.
Large-scale usage would require further performance optimization, caching, load balancing, and infrastructure planning.
Advanced artificial-intelligence-based recommendations and content-analysis systems are not core requirements of the current version.
Additional moderation and verification mechanisms may be required for larger-scale deployment.
Future Enhancements

Future development possibilities include:

Dedicated Android and iOS applications
Advanced professional recommendations
AI-assisted features
Advanced search
Enhanced professional verification
Video communication
Advanced analytics
Enhanced recruitment functionality
Research collaboration improvements
Improved scalability
Advanced security mechanisms
Multilingual support

These features are considered future enhancements and are not represented as core functionality of the current implementation.

Project Status

Status: Academic Full-Stack Software Project

Platform: Web Application

Domain: Healthcare Professional Networking

Development Approach: Iterative and Incremental

Key Technologies
Frontend        → React + TypeScript + Vite
Styling         → Tailwind CSS
Routing         → React Router
Data Management → TanStack Query
Animation       → Framer Motion

Backend         → Python + FastAPI + Uvicorn
Database        → MongoDB + MongoDB Atlas

Authentication  → JWT + Password Hashing
Verification    → Email OTP + Professional Verification
Authorization   → Role-Based Access Control

Real-Time       → WebSocket
Media           → Cloudinary
Notifications   → Firebase Cloud Messaging
Email           → SMTP
Academic Project

MediConnect was developed as an academic full-stack software project to demonstrate the design and implementation of a healthcare-focused professional networking platform.

The project demonstrates the integration of frontend development, backend API development, database management, authentication, authorization, real-time communication, external services, testing, debugging, and system design within a single application.

Author

Satish Yadav

B.Sc. Computer Science

SIES College of Arts, Science and Commerce
(Empowered Autonomous), Sion (W), Mumbai

License

This project is developed for academic and educational purposes.


### One important thing before you push it

I deliberately **did not add** things like Docker deployment, Render deployment, AI recommendation, video calling, payment systems, medical consultation, or other features as currently implemented. Your Black Book specifically treats several of those as **future enhancements**, so the README keeps them under that section instead of falsely presenting them as existing functionality. :contentReference[oaicite:2]{index=2}

Also, the execution commands for the backend and frontend match the latest Black Book: `python -m uvicorn app.main:app --reload` and `npm run dev`. :contentReference[oaicite:3]{index=3}
