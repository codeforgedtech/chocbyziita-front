import Header from './components/Header';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Products from './pages/Products';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import Auth from './components/Auth';
import { CartProvider } from './contexts/CartContext'; 
import SingleProduct from './pages/SingleProduct';
import OrderConfirmation from './components/OrderConfirmation';
import AdminLogin from './components/Admin/AdminLogin';
import AdminDashboard from './components/Admin/AdminDashboard';
import AddProduct from './components/Admin/AddProduct';
import Customers from './components/Admin/Customers';
import Orders from './components/Admin/Orders';
import ProductsAdmin from './components/Admin/ProductsAdmin'; 

function App() {
;

  return (
    <CartProvider>
    <Router>
      <Header/>
      <Routes>
        <Route path="/" element={<Products />} />
        <Route path="/product/:id" element={<SingleProduct />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout/>} />
        <Route path="/login" element={<Auth />} />
        <Route path="/products" element={<Products />} />
        <Route path="/order-confirmation" element={<OrderConfirmation />} />
       
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/" element={<AdminDashboard />} />
        <Route path="/admin/add-product" element={<AddProduct />} />
        <Route path="customers" element={<Customers />} />
            <Route path="orders" element={<Orders />} />
            <Route path="products" element={<ProductsAdmin />} />
              </Routes>

    </Router>
    </CartProvider>
  );
}

export default App;
