# Technology Stack & Build System

## Frontend Stack
- **React 18.2.0** - Main UI framework
- **React Router DOM 6.15.0** - Client-side routing
- **Tailwind CSS 3.3.3** - Utility-first CSS framework
- **Axios 1.5.0** - HTTP client for API calls
- **React Toastify 9.1.3** - Toast notifications
- **Lucide React 0.263.1** - Icon library
- **React Image Zoom 1.3.1** - Product image zoom functionality

## Backend Stack
- **Node.js with Express 4.18.2** - Server framework
- **MongoDB with Mongoose 7.5.0** - Database and ODM
- **JWT (jsonwebtoken 9.0.2)** - Authentication tokens
- **bcryptjs 2.4.3** - Password hashing
- **Multer 1.4.5** - File upload handling
- **Stripe 13.5.0** - Payment processing
- **Nodemailer 6.9.4** - Email functionality
- **Winston 3.10.0** - Logging
- **Helmet 7.0.0** - Security middleware
- **Express Rate Limit 6.10.0** - Rate limiting

## Development Tools
- **Concurrently 8.2.2** - Run multiple commands
- **Nodemon 3.0.1** - Server auto-restart
- **Jest 29.6.4** - Testing framework

## Common Commands

### Development
```bash
# Install all dependencies (root, client, server)
npm run install-all

# Start both client and server in development
npm run dev

# Start only client (React dev server)
npm run client

# Start only server (Node.js with nodemon)
npm run server
```

### Production
```bash
# Build client for production
npm run build

# Start production server
cd server && npm start
```

### Testing
```bash
# Run client tests
cd client && npm test

# Run server tests
cd server && npm test
```

## Configuration Notes
- Client runs on port 3000 (development)
- Server runs on port 5000
- Client proxy configured to forward API calls to server
- JWT tokens stored in localStorage
- Cart data persisted in localStorage