import Header from './components/Header';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Products from './pages/Products';

import Checkout from './components/Checkout';
import Login from './components/Login';
import SignUp from "./components/SignUp"
import { CartProvider } from './contexts/CartContext'; 
import SingleProduct from './pages/SingleProduct';
import AllProducts from './pages/AllProducts'
import OrderConfirmation from './components/OrderConfirmation';
import Home from"./pages/Home"
import Footer from './components/Footer';

function App() {
;

  return (
    <CartProvider>
    <Router>
      <Header/>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/product/:id" element={<SingleProduct />} />
 <Route path="/products/" element={<AllProducts />} />
        <Route path="/checkout" element={<Checkout/>} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/products" element={<Products />} />
        <Route path="/order-confirmation" element={<OrderConfirmation />} />
              </Routes>
              <Footer />
    </Router>
    </CartProvider>
  );
}

export default App;
