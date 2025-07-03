# Hardware Management System

A comprehensive hardware management application with authentication and user management.

## Features

- **Authentication System**: Secure login/logout functionality
- **Dashboard**: Overview of hardware inventory and statistics
- **Department Management**: Add, edit, delete, and view departments
- **Hardware Management**: Complete hardware lifecycle management
- **Deployment Tracking**: Track hardware deployments and returns
- **Employee Management**: Manage employee assignments and hardware assignments

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or cloud instance)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd hardware-management
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/hardware-management
SESSION_SECRET=your-super-secret-session-key-change-this-in-production
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:3000`

## Default Login Credentials

When you first run the application, a default admin user will be automatically created:

- **Username**: `admin`
- **Password**: `admin123`

⚠️ **Important**: Please change the default password after your first login for security purposes.

## Authentication System

### Public Routes
- `/login` - Login page (accessible without authentication)

### Protected Routes
All other routes require authentication:
- `/` - Dashboard
- `/department/*` - Department management
- `/hardware/*` - Hardware management
- `/deployment/*` - Deployment management
- `/employee/*` - Employee management

### Session Management
- Sessions are managed using `express-session`
- Session data is stored in memory (for production, consider using Redis or MongoDB session store)
- Automatic logout on session expiration

## Security Features

- Password hashing using bcryptjs
- Session-based authentication
- Protected routes with middleware
- Flash messages for user feedback
- CSRF protection through session management

## Project Structure

```
hardware-management/
├── middleware/
│   └── auth.js              # Authentication middleware
├── models/
│   ├── User.js              # User model
│   ├── Department.js        # Department model
│   ├── Hardware.js          # Hardware model
│   └── ...                  # Other models
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── dashboard.js         # Dashboard routes
│   └── ...                  # Other route files
├── utils/
│   ├── dbconnect.js         # Database connection
│   └── createDefaultUser.js # Default user creation
├── views/
│   ├── auth/
│   │   └── login.ejs        # Login page
│   ├── partials/
│   │   └── navbar.ejs       # Navigation bar
│   └── 404.ejs              # 404 error page
└── server.js                # Main server file
```

## Error Handling

- Custom 404 page for non-existent routes
- Flash messages for user feedback
- Proper error logging and handling
- Graceful fallbacks for database errors

## Development

To start development:

```bash
npm run dev
```

The server will run on `http://localhost:3000` with hot reload enabled.

## Production Deployment

For production deployment:

1. Set appropriate environment variables
2. Use a production MongoDB instance
3. Configure session store (Redis recommended)
4. Set up proper logging
5. Configure HTTPS
6. Change default admin credentials

## License

This project is licensed under the ISC License. 