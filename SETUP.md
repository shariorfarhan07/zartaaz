# Zartaaz Setup Guide

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Git

## Installation Steps

### 1. Clone and Install Dependencies

```bash
# Install root dependencies
npm run install-all

# Or install manually:
npm install
cd client && npm install
cd ../server && npm install
```

### 2. Environment Setup

```bash
# Copy environment file
cp server/.env.example server/.env
```

Edit `server/.env` with your configuration:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/zartaaz

# JWT
JWT_SECRET=your_super_secret_jwt_key_here

# Email (for invoices)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Stripe (optional)
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
```

### 3. Database Setup

Make sure MongoDB is running:

```bash
# Local MongoDB
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in .env file
```

### 4. Start Development Servers

```bash
# Start both client and server
npm run dev

# Or start individually:
npm run server  # Backend on port 5000
npm run client  # Frontend on port 3000
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

## Project Structure

```
zartaaz/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── context/        # React context providers
│   │   ├── pages/          # Page components
│   │   └── App.js          # Main app component
│   ├── public/             # Static assets
│   └── package.json
├── server/                 # Node.js backend
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   └── index.js            # Server entry point
├── shared/                 # Shared utilities
└── package.json            # Root package.json
```

## Features Implemented

### ✅ Core Features
- **Landing Page**: Minimalist design with tribal/floral motifs
- **Product Catalog**: Grid/list view with filtering and sorting
- **Product Details**: Large images, variants, add to cart/wishlist
- **Shopping Cart**: Full cart management with quantity updates
- **Wishlist**: Save products for later
- **Authentication**: Login/register with JWT tokens
- **Responsive Design**: Mobile-first approach

### ✅ Backend Features
- **User Management**: Registration, login, profile management
- **Product Management**: CRUD operations with variants
- **Order Management**: Order processing and status tracking
- **Database Models**: User, Product, Order schemas
- **API Security**: JWT auth, rate limiting, input validation
- **Logging**: Request logging and error handling

### 🚧 In Progress
- Admin dashboard with analytics
- Payment integration (Stripe)
- Email notifications and invoices
- Advanced search and filters
- Product reviews and ratings

## Development Commands

```bash
# Install all dependencies
npm run install-all

# Start development servers
npm run dev

# Start only backend
npm run server

# Start only frontend
npm run client

# Build for production
npm run build
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Products
- `GET /api/products` - Get products with filtering
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Orders
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get single order
- `PUT /api/orders/:id` - Update order status (admin)

## Design Guidelines

- **Minimalist aesthetic**: Clean, uncluttered interfaces
- **Tribal/floral motifs**: Subtle patterns integrated throughout
- **Mobile-first**: Responsive design for all devices
- **Color palette**: Neutral grays with accent colors
- **Typography**: Inter for body text, Playfair Display for headings

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check MONGODB_URI in .env file

2. **Port Already in Use**
   - Kill processes on ports 3000/5000
   - Or change ports in package.json

3. **Module Not Found**
   - Run `npm run install-all`
   - Clear node_modules and reinstall

4. **CORS Issues**
   - Check CLIENT_URL in server .env
   - Ensure proxy is set in client package.json

### Getting Help

- Check the logs in `server/logs/` directory
- Use browser dev tools for frontend issues
- Check MongoDB logs for database issues

## Next Steps

1. Set up your MongoDB database
2. Configure environment variables
3. Add sample products via admin panel
4. Customize the design to match your brand
5. Set up payment processing
6. Deploy to production

Happy coding! 🚀