# MediConnect API Documentation

## Overview
MediConnect is a healthcare professional networking, recruitment, messaging, and career platform.

## Base URL
- Development: `http://localhost:8000/api/v1`
- Production: `https://api.mediconnect.example.com/api/v1`

## Authentication
All protected endpoints require a JWT Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Response Format
All endpoints return consistent JSON:
```json
{
    "success": true,
    "message": "Operation completed successfully",
    "data": {},
    "errors": null
}
```

## API Modules

### Authentication (`/auth`)
- POST `/register` - Register new account
- POST `/verify-email` - Verify email with OTP
- POST `/resend-otp` - Resend verification OTP
- POST `/login` - Login with email/password
- POST `/refresh` - Refresh access token
- POST `/logout` - Logout current session
- POST `/logout-all` - Logout all sessions
- POST `/forgot-password` - Request password reset
- POST `/reset-password` - Reset password with token
- POST `/change-password` - Change password
- GET `/me` - Get current user
- GET `/sessions` - List active sessions
- DELETE `/sessions/{session_id}` - Terminate session

### Users (`/users`)
- GET `/me` - Get own profile
- PUT `/me` - Update own profile
- GET `/{user_id}` - Get user profile
- GET `/search` - Search users
- POST `/profile-photo` - Upload profile photo
- POST `/cover-photo` - Upload cover photo
- POST `/verification` - Submit professional verification
- GET `/verification-status` - Get verification status
- Education, Experience, Skills, Certifications, Languages CRUD

### Organizations (`/organizations`)
- POST `/` - Create organization
- GET `/` - List organizations
- GET `/{organization_id}` - Get organization
- PATCH `/{organization_id}` - Update organization
- DELETE `/{organization_id}` - Delete organization
- Employee management endpoints
- GET `/search` - Search organizations

### Posts (`/posts`)
- POST `/` - Create post
- GET `/feed` - Get chronological feed
- GET `/feed/ranked` - Get ranked/trending feed
- GET `/{post_id}` - Get post
- PATCH `/{post_id}` - Update post
- DELETE `/{post_id}` - Delete post
- Reactions, bookmarks, shares, reports
- Comments CRUD
- Media upload/delete
- Post pin/unpin

### Connections (`/connections`)
- POST `/request` - Send connection request
- POST `/accept` - Accept connection
- POST `/reject` - Reject connection
- DELETE `/remove` - Remove connection
- POST `/follow` - Follow user
- DELETE `/unfollow` - Unfollow user
- GET `/followers` - List followers
- GET `/following` - List following

### Search (`/search`)
- GET `/` - Universal search
- GET `/trending` - Trending topics
- GET `/recent` - Recent searches
- POST `/recent` - Save search
- DELETE `/recent` - Delete recent search
- GET `/recommendations` - Get recommendations

### Messages (`/messages`)
- POST `/` - Send message
- GET `/conversations` - List conversations
- GET `/conversations/{conversation_id}` - Get conversation
- PATCH `/{message_id}` - Edit message
- DELETE `/{message_id}` - Delete message
- Reactions, pinning, archiving, search

### Notifications (`/notifications`)
- GET `/` - List notifications
- PATCH `/{notification_id}/read` - Mark as read
- PATCH `/read-all` - Mark all as read
- DELETE `/{notification_id}` - Delete notification

### Devices (`/devices`)
- POST `/register` - Register device
- GET `/` - List devices
- DELETE `/{device_id}` - Remove device

### Jobs (`/jobs`)
- POST `/` - Create job
- GET `/` - List jobs
- GET `/{job_id}` - Get job details
- PATCH `/{job_id}` - Update job
- DELETE `/{job_id}` - Delete job
- POST `/{job_id}/apply` - Apply to job
- GET `/applications` - List applications
- PATCH `/applications/{application_id}` - Update application

### Internships (`/internships`)
- CRUD + Apply + Applications

### Events (`/events`)
- CRUD + Register/Cancel registration
- Attendance, certificates

### Mentorship (`/mentorship`)
- Mentor profiles, requests, sessions
- Available mentors, mentee management

### Admin (`/admin`)
- Dashboard, stats, user management
- Organization management
- Reports, verifications
- Audit logs, analytics
- Security monitoring
- Announcements, role management
- System settings

### Analytics (`/analytics`)
- Profile analytics
- Organization analytics
- Platform analytics

### Settings (`/settings`)
- Privacy, notifications, password
- Email update, account deactivation
- Blocked users, sessions, appearance

## WebSocket Routes
- `/ws/chat` - Real-time messaging
- `/ws/notifications` - Real-time notifications
- `/ws/presence` - Online presence
- `/ws/organization/{organization_id}` - Organization channels
- `/ws/channel/{channel_id}` - Channel messaging

## Rate Limiting
- Authentication endpoints: 5 requests/minute
- Search: 30 requests/minute
- Messaging: 60 messages/minute
- File uploads: 10 uploads/minute
- General API: 100 requests/minute
