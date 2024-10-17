import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../supabaseClient'; 
import './Header.css';
import { useNavigate } from 'react-router-dom'; 
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaRegUser, FaSearch, FaHeart, FaShoppingBag, FaTrash } from "react-icons/fa";
import logo from "../assets/Choc by Z.png";
import { useEffect, useState } from 'react';


export default function Header() {
    const { cartItems, removeFromCart, updateQuantity } = useCart();
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [isCartOpen, setIsCartOpen] = useState(false); // For toggling cart dropdown
    const navigate = useNavigate();
    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) {
                console.error('Error fetching session:', error.message);
                return;
            }

            if (session) {
                const user = session.user;
                setUserEmail(user.email || null);
            } else {
                setUserEmail(null); 
            }
        };

        fetchUserData();
    }, []);

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error logging out:', error.message);
        } else {
            setUserEmail(null); 
            console.log('Användaren har loggats ut');
        }
    };
    const handleCheckout = () => {
        // Navigera till Checkout med cartItems
        navigate('/checkout', { state: { cartItems } });
      };
    const toggleCart = () => {
        setIsCartOpen(!isCartOpen); // Toggle cart visibility
    };

    const getTotalPriceWithTax = () => {
        const TAX_RATE = 0.25;
        return cartItems.reduce((total, item) => {
            const subtotal = item.product.price * item.quantity;
            return total + subtotal * (1 + TAX_RATE);
        }, 0).toFixed(2);
    };

    const handleQuantityChange = (productId: number, newQuantity: number, maxQuantity: number) => {
        if (newQuantity > maxQuantity) {
            alert(`Det finns bara ${maxQuantity} enheter i lager för den här produkten.`);
            updateQuantity(productId, maxQuantity);
        } else if (newQuantity < 1) {
            alert(`Antalet måste vara minst 1.`);
            updateQuantity(productId, 1);
        } else {
            updateQuantity(productId, newQuantity);
        }
    };

    return (
        <header>
            {/* Top Bar with Phone and Icons */}
            <div className="top-bar d-flex justify-content-between align-items-center py-2 px-4">
                {/* Phone number on the left */}
                <div className="phone-number">
                    <span>+46 123 456 789</span>
                </div>

                {/* Logo in the center */}
                <div className="container d-flex flex-column align-items-center">
                    <div className="logo text-center">
                        <Link className="navbar-brand" to="/">
                            <img src={logo} alt="logotype" />
                        </Link>
                    </div>
                </div>

                {/* Icons (Login, Search, Favorites, Cart) on the right */}
                <div className="icons d-flex align-items-center">
                    {/* Login icon */}
                    {userEmail ? (
                        <Link className="btn btn" to="#" onClick={handleLogout}>
                            Logga ut
                        </Link>
                    ) : (
                        <Link className="btn btn" to="/login">
                            <FaRegUser />
                        </Link>
                    )}

                    {/* Search icon */}
                    <Link className="btn btn" to="/search">
                        <FaSearch />
                    </Link>

                    {/* Favorites (Heart) icon */}
                    <Link className="btn btn" to="/favorites">
                        <FaHeart />
                    </Link>

                    {/* Cart icon with dropdown */}
                    <div className="cart-wrapper position-relative">
                        <button className="btn btn position-relative" onClick={toggleCart}>
                            <FaShoppingBag />
                            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                {cartItems.reduce((total, item) => total + item.quantity, 0)}
                            </span>
                        </button>

                        {/* Cart dropdown */}
                        {isCartOpen && (
                            <div className="cart-dropdown">
                                {cartItems.length === 0 ? (
                                    <p>Inga varor i varukorgen</p>
                                ) : (
                                    <div className="cart-content">
                                        {cartItems.map((item) => (
                                            <div key={item.product.id} className="cart-item">
                                                    <img
                    src={item.product.image_url && item.product.image_url.length > 0 ? item.product.image_url[0] : 'https://via.placeholder.com/150'} // Visa endast första bilden
                    alt={item.product.name}
                    className="img-fluid rounded shadow-sm"
                  />
                
                                                <div className="cart-item-details">
                                                    <h4>{item.product.name}</h4>
                                                    <p>{(item.product.price * 1.25).toFixed(2)} SEK</p>
                                                    <p>Antal: {item.quantity}</p>
                                                </div>
                                                <div className='cart-item-actions'>
                                                  <div className="cart-item-transperant">
                                                    <button onClick={() => handleQuantityChange(item.product.id, item.quantity - 1, item.product.stock)}>-</button>
                                                    <span className='cart-item-transperant'>{item.quantity}</span>
                                                    <button onClick={() => handleQuantityChange(item.product.id, item.quantity + 1, item.product.stock)}>+</button>
                                                    
                                                   
                                                   </div>
                                                </div>
                                                <button onClick={() => removeFromCart(item.product.id)} className='cart-item-trash'>
                                                        <FaTrash />
                                                    </button>
                                            </div>
                                            
                                        ))}
                                        
                                    </div>
                                )}

                                {/* Total Price with Tax */}
                                <div className="cart-total">
                                    <h4>Total: {getTotalPriceWithTax()} SEK</h4>
                                </div>

                                {/* Checkout and Cancel buttons */}
                                <button className="btn-primary-cart"  onClick={handleCheckout}>Till kassan</button>
                                <button className="btn-cancel-cart" onClick={toggleCart}>Avbryt</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation Menu */}
            <nav className="navbar navbar-expand-lg navbar-light">
                <div className="container">
                    <button
                        className="navbar-toggler"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#navbarNav"
                        aria-controls="navbarNav"
                        aria-expanded="false"
                        aria-label="Toggle navigation"
                    >
                        <span className="navbar-toggler-icon"></span>
                    </button>

                    <div className="collapse navbar-collapse justify-content-center" id="navbarNav">
                        <ul className="navbar-nav mb-2 mb-lg-0 text-center">
                            <li className="nav-item">
                                <Link className="nav-link" to="/">Hem</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/products">Produkter</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/about">Om</Link>
                            </li>
                            <li className="nav-item">
                                <Link className="nav-link" to="/contact">Kontakt</Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
        </header>
    );
}












