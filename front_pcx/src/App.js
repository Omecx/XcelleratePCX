import './App.css';

// Routing
import { BrowserRouter as Router, Route, Routes, Outlet, Navigate, Link } from 'react-router-dom';
import PrivateRoutes from './utils/PrivateRoutes';

// Config
import { USER_ROLES } from './Contexts/config';

// Contexts
import { AuthProvider } from './Contexts/AuthContext';
import { ApiDataProvider } from './Contexts/ApiDataContext';
import { RootContextProvider } from './Contexts/RootContext';

// Assets  
import NavBar from './components/NavBar/NavBar';
import Footer from './components/Footer/Footer';
import HomePage from './components/Homepage/HomePage';
import LoginPage from './components/LoginPage/LoginPage';
import RegisterPage from './components/RegisterPage/RegisterPage';
import CategoriesPage from './components/CategoriesPage/CategoriesPage';
import AllProductsPage from './components/AllProductsPage/AllPrductsPage';
import CategoryProducts from './components/CategoryProducts/CategoryProducts';
import ProductDetailPage from './components/ProductDetailPage/ProductDetailPage';
import CheckoutPage from './components/CheckoutPage/CheckoutPage';
import OrderPlaced from './components/OrderStatus/OrderPlaced';
import OrderFailed from './components/OrderStatus/OrderFailed';

// Customer DashBoard
import CustomerDashBoard from './components/AccountPage/Customer/DashBoard/CustomerAccount';
import CustomerOrdersPage from './components/AccountPage/Customer/OrdersPage/CustomerOrdersPage';
import CustomerWishList from './components/AccountPage/Customer/WishList/CustomerWishList';
import CustomerAddresses from './components/AccountPage/Customer/Addresses/CustomerAddresses';
import AddAddress from './components/AccountPage/Customer/Addresses/AddressForm';
import EditAddress from './components/AccountPage/Customer/Addresses/EditAddressForm';
import UserProfile from './components/AccountPage/Profile/UserProfile';

// Vendor DashBoard
import VendorDashBoard from './components/AccountPage/Vendor/DashBoard/VendorAccount';
import VendorProducts from './components/AccountPage/Vendor/VendorProducts/VendorProducts';
import AddProduct from './components/AccountPage/Vendor/VendorProducts/AddProduct';
import EditProduct from './components/AccountPage/Vendor/VendorProducts/EditProduct';

// Supplementary Assets
import Carousal from './components/rejCar/Carousal';

// Data
import { offers } from './components/rejCar/CarousalData';

// Layout components
const MainLayout = () => {
  return (
    <>
      <header className="App-header">
        <NavBar />
      </header>
      <main>
        <Outlet />
      </main>
      <footer>
        <Footer />
      </footer>
    </>
  );
};

const AuthLayout = () => {
  return (
    <main>
      <Outlet />
    </main>
  );
};

// Admin Dashboard placeholder component
const AdminDashboard = () => (
  <div className="admin-dashboard">
    <h1>Admin Dashboard</h1>
    <p>Welcome to the admin dashboard. This is a placeholder for the admin interface.</p>
    <div className="admin-links">
      <h2>Quick Links</h2>
      <ul>
        <li><Link to="/admin/users">Manage Users</Link></li>
        <li><Link to="/admin/products">Manage Products</Link></li>
        <li><Link to="/admin/categories">Manage Categories</Link></li>
        <li><Link to="/admin/orders">Manage Orders</Link></li>
      </ul>
    </div>
  </div>
);

// Admin placeholder components
const AdminUsers = () => <div><h1>Admin Users Management</h1><p>This is a placeholder for the admin users management page.</p></div>;
const AdminProducts = () => <div><h1>Admin Products Management</h1><p>This is a placeholder for the admin products management page.</p></div>;
const AdminCategories = () => <div><h1>Admin Categories Management</h1><p>This is a placeholder for the admin categories management page.</p></div>;
const AdminOrders = () => <div><h1>Admin Orders Management</h1><p>This is a placeholder for the admin orders management page.</p></div>;

function App() {
  return (
    <Router>
      {/* Wrap everything in AuthProvider, but inside Router */}
      <AuthProvider>
        {/* ApiDataProvider depends on AuthProvider, so it must be nested inside */}
        <ApiDataProvider>
          {/* RootContextProvider (with CartContext etc.) depends on AuthProvider */}
          <RootContextProvider>
            <Routes>
              {/* Auth Routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              {/* Main Layout Routes */}
              <Route element={<MainLayout />}>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/products" element={<AllProductsPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/product/:product_slug/:product_id" element={<ProductDetailPage />} />
                <Route path="/category/:category_slug/:category_id" element={<CategoryProducts />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/order/placed" element={<OrderPlaced />} />
                <Route path="/order/failed" element={<OrderFailed />} />
                <Route path="/carousal" element={<Carousal data={offers} />} />

                {/* Customer Routes */}
                <Route element={<PrivateRoutes allowedRoles={[USER_ROLES.CUSTOMER]} />}>
                  <Route path="/customer/dashboard" element={<CustomerDashBoard />} />
                  <Route path="/customer/orders" element={<CustomerOrdersPage />} />
                  <Route path="/customer/wishlist" element={<CustomerWishList />} />
                  <Route path="/customer/addresses" element={<CustomerAddresses />} />
                  <Route path="/customer/address/add_new" element={<AddAddress />} />
                  <Route path="/customer/address/edit/:address_id" element={<EditAddress />} />
                  <Route path="/customer/profile" element={<UserProfile />} />
                </Route>

                {/* Vendor Routes */}
                <Route element={<PrivateRoutes allowedRoles={[USER_ROLES.VENDOR]} />}>
                  <Route path="/vendor/dashboard" element={<VendorDashBoard />} />
                  <Route path="/vendor/products" element={<VendorProducts />} />
                  <Route path="/vendor/products/add_new" element={<AddProduct />} />
                  <Route path="/vendor/products/edit/:product_id" element={<EditProduct />} />
                  <Route path="/vendor/profile" element={<UserProfile />} />
                </Route>
                
                {/* Admin Routes */}
                <Route element={<PrivateRoutes allowedRoles={[USER_ROLES.ADMIN]} />}>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/products" element={<AdminProducts />} />
                  <Route path="/admin/categories" element={<AdminCategories />} />
                  <Route path="/admin/orders" element={<AdminOrders />} />
                </Route>
                
                {/* Redirect legacy routes */}
                <Route path="/account/customer/*" element={<Navigate to="/customer/dashboard" replace />} />
                <Route path="/account/vendor/*" element={<Navigate to="/vendor/dashboard" replace />} />
                <Route path="/account/admin/*" element={<Navigate to="/admin/dashboard" replace />} />
                
                {/* Catch-all route for 404 */}
                <Route path="*" element={<div className="not-found">Page not found</div>} />
              </Route>
            </Routes>
          </RootContextProvider>
        </ApiDataProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
