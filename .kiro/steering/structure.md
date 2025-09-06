# Project Structure & Organization

## Root Level Structure
```
zartaaz/
├── client/          # React frontend application
├── server/          # Node.js backend API
├── package.json     # Root package with dev scripts
└── README.md        # Project documentation
```

## Frontend Structure (client/)
```
client/
├── src/
│   ├── components/
│   │   └── Layout/     # Navbar, Footer, common layout components
│   ├── context/        # React Context providers
│   │   ├── AuthContext.js     # Authentication state management
│   │   ├── CartContext.js     # Shopping cart state management
│   │   └── WishlistContext.js # Wishlist state management
│   ├── pages/          # Route components
│   │   ├── Auth/       # Login, Register pages
│   │   ├── Admin/      # Admin dashboard, products, orders
│   │   └── *.js        # Public pages (Home, ProductList, etc.)
│   ├── App.js          # Main app component with routing
│   └── App.css         # Global styles
├── package.json        # Frontend dependencies
└── tailwind.config.js  # Tailwind CSS configuration
```

## Backend Structure (server/)
```
server/
├── index.js           # Main server entry point
├── package.json       # Backend dependencies
└── [API structure to be implemented]
```

## Architecture Patterns

### Frontend Patterns
- **Context + useReducer** for global state management (Auth, Cart, Wishlist)
- **Component-based architecture** with clear separation of concerns
- **Route-based code splitting** with pages directory
- **Layout components** for consistent UI structure
- **Custom hooks** for context consumption (useAuth, useCart, etc.)

### State Management
- **AuthContext**: User authentication, login/logout, token management
- **CartContext**: Shopping cart items, quantities, local storage persistence
- **WishlistContext**: User wishlist management
- **Local Storage**: Cart and auth token persistence

### Routing Structure
- **Public routes**: Home, products, product details, cart, wishlist
- **Auth routes**: Login, register
- **Protected routes**: Profile, order history
- **Admin routes**: Dashboard, product management, order management

### Naming Conventions
- **Components**: PascalCase (e.g., `ProductList.js`)
- **Context files**: PascalCase with Context suffix (e.g., `AuthContext.js`)
- **Pages**: PascalCase matching route names
- **Hooks**: camelCase with use prefix (e.g., `useAuth`)
- **CSS classes**: Tailwind utility classes, kebab-case for custom classes

### File Organization Rules
- Group related components in subdirectories
- Keep context providers in dedicated `context/` directory
- Separate admin functionality in `pages/Admin/`
- Layout components in `components/Layout/`
- One component per file with default export