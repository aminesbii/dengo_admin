# Dengo Admin Dashboard

A comprehensive admin panel for managing the Dengo multi-vendor marketplace platform. Built with React, Vite, and connected to the Express backend API.

## 🚀 Features

### Dashboard
- Real-time statistics (Orders, Revenue, Users, Products)
- Interactive charts and analytics using Recharts
- Order status distribution visualization
- Recent order activity feed

### User & Seller Management
- View all customers and sellers
- Search and filter functionality
- User verification status tracking
- Seller information and company details

### Order Management
- Complete order listing with status tracking
- Filter orders by status (Pending, Completed, Cancelled)
- Search orders by ID or customer name
- Order details and history

### Product Management
- Browse and manage all marketplace products
- Filter by category
- Track inventory and stock status
- View product ratings and seller information
- Low stock alerts

### Category Management
- Manage product categories
- View category hierarchy
- Track product count per category
- Create and edit categories

### Shipping & Warehouses
- Warehouse inventory management
- Real-time stock level monitoring
- Capacity utilization tracking
- Shipment tracking and management

## 📋 Prerequisites

- Node.js >= 14.0.0
- npm >= 6.0.0
- Backend API running on `http://localhost:5000`

## 🛠️ Installation

1. **Install dependencies**
   ```bash
   cd admin
   npm install
   ```

2. **Configure environment**
   
   The `.env` file is already configured with:
   ```
   API_BASE_URL=http://localhost:5000/api/v1
   ```

   Adjust this if your backend is running on a different URL.

## 🏃 Running the Dashboard

### Development Server
```bash
npm run dev
```
The dashboard will be available at `http://localhost:5173`

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 🔐 Login

Use the following credentials to access the admin dashboard:

**Email:** `admin@gmail.com`  
**Password:** `admin123456`

These credentials can be generated using:
```bash
cd ../backend
npm run seed:admin
```

## 📁 Project Structure

```
admin/
├── src/
│   ├── components/          # Reusable components
│   │   ├── Sidebar.jsx      # Navigation sidebar
│   │   └── Header.jsx       # Top header with user info
│   ├── context/             # Context API (Auth)
│   │   └── AuthContext.jsx  # Authentication state management
│   ├── pages/               # Page components
│   │   ├── Login.jsx        # Login page
│   │   ├── Dashboard.jsx    # Main dashboard
│   │   ├── Users.jsx        # Users & Sellers management
│   │   ├── Orders.jsx       # Orders management
│   │   ├── Products.jsx     # Products management
│   │   ├── Categories.jsx   # Categories management
│   │   └── Shipping.jsx     # Shipping & Warehouses
│   ├── services/            # API services
│   │   └── api.js           # Axios API client
│   ├── styles/              # CSS modules
│   │   ├── Sidebar.module.css
│   │   ├── Header.module.css
│   │   ├── Login.module.css
│   │   ├── Dashboard.module.css
│   │   └── DataTable.module.css
│   ├── App.jsx              # Main app with routing
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── .env                      # Environment configuration
├── package.json             # Dependencies
└── vite.config.js           # Vite configuration
```

## 🔌 API Integration

The dashboard integrates with the backend API through the following modules:

### Authentication
- `authAPI.login()` - Admin login
- `authAPI.refreshToken()` - Token refresh

### Users
- `userAPI.getProfile()` - Get admin profile
- `userAPI.listSellers()` - List all sellers
- `userAPI.getSellerProfile()` - Get seller details

### Products
- `productAPI.searchProducts()` - Search products
- `productAPI.getProduct()` - Get product details
- `productAPI.getFeaturedProducts()` - Featured products

### Orders
- `orderAPI.getUserOrders()` - Get user orders
- `orderAPI.getOrder()` - Get order details
- `orderAPI.updateOrderStatus()` - Update order status
- `orderAPI.getOrderAnalytics()` - Order analytics

### Categories
- `categoryAPI.getCategories()` - List categories
- `categoryAPI.getCategoryHierarchy()` - Category tree
- `categoryAPI.createCategory()` - Create category

### Shipping
- `shippingAPI.listWarehouses()` - List warehouses
- `shippingAPI.getWarehouseInventory()` - Warehouse stock

## 🎨 UI Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Theme**: CSS variables for easy theming
- **Data Tables**: Searchable, filterable tables with pagination
- **Charts**: Interactive charts using Recharts
- **Icons**: React Icons for consistent UI
- **Form Validation**: Client-side input validation
- **Loading States**: Smooth loading indicators
- **Error Handling**: User-friendly error messages

## 🔄 State Management

The dashboard uses:
- **Context API** for authentication state
- **React Hooks** (useState, useEffect) for component state
- **localStorage** for persisting auth tokens

## 📦 Dependencies

- **react** - UI library
- **react-router-dom** - Client-side routing
- **axios** - HTTP client for API calls
- **react-icons** - Icon library
- **recharts** - Chart library
- **date-fns** - Date utilities

## 🛡️ Security Features

- JWT token-based authentication
- Protected routes (redirects to login if not authenticated)
- Token stored in localStorage (consider using secure cookies for production)
- Authorization checks on API calls

## 📊 Data Visualization

- Line charts for trends (Orders & Revenue)
- Pie charts for distribution (Order Status)
- Progress bars for warehouse capacity
- Stat cards with key metrics
- Table views for detailed data

## 🎯 Future Enhancements

- [ ] Advanced filtering and search
- [ ] Bulk operations (batch updates)
- [ ] Export to CSV/PDF reports
- [ ] Real-time notifications
- [ ] User activity logs
- [ ] Analytics and reporting dashboard
- [ ] Role-based access control
- [ ] Multi-language support
- [ ] Dark mode toggle
- [ ] Performance optimization

## 🐛 Troubleshooting

### Dashboard not loading
1. Ensure backend API is running on `http://localhost:5000`
2. Check `.env` file for correct `API_BASE_URL`
3. Check browser console for errors

### Login fails
1. Verify backend is running
2. Ensure admin user exists: `npm run seed:admin` from backend
3. Check API response in network tab

### Data not loading
1. Verify backend APIs are working
2. Check authentication token is valid
3. Review API error responses in console

## 📝 License

MIT - See LICENSE file in root

## 👥 Support

For issues or questions:
1. Check the backend [API_DOCUMENTATION.md](../backend/API_DOCUMENTATION.md)
2. Review the [ADMIN_QUICK_REFERENCE.md](../backend/ADMIN_QUICK_REFERENCE.md)
3. Contact the development team
