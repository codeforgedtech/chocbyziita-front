import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../supabaseClient'; 
import './Header.css';
import { useNavigate } from 'react-router-dom'; 
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaRegUser, FaSearch, FaHeart, FaShoppingBag, FaTrash } from "react-icons/fa";
import logo from "../assets/Choc by Z.png";
import { useEffect, useState } from 'react';
import { Modal } from 'react-bootstrap'; // Importera Modal

export default function Header() {
    const { cartItems, removeFromCart, updateQuantity } = useCart();
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [userFirstName, setUserFirstName] = useState<string | null>(null); // Förnamn
    const [isCartOpen, setIsCartOpen] = useState(false); // För att växla varukorgens dropdown
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false); // För att växla användarmenyn
    const [isNavOpen, setIsNavOpen] = useState(false); // För att växla navigationsmenyn
    const [showModal, setShowModal] = useState(false); // För att styra visningen av modalen
    const [modalMessage, setModalMessage] = useState(''); // Meddelande för modalen
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
                
                // Hämta användarens metadata från databasen
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('first_name')
                    .eq('id', user.id)
                    .single();

                if (userError) {
                    console.error('Error fetching user data:', userError.message);
                } else {
                    setUserFirstName(userData?.first_name || null); // Sätta förnamn
                }
            } else {
                setUserEmail(null); 
                setUserFirstName(null);
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
            setUserFirstName(null); // Återställ förnamnet vid utloggning
            console.log('Användaren har loggats ut');
        }
    };

    const handleCheckout = () => {
        setIsCartOpen(false);
        navigate('/checkout', { state: { cartItems } });
    };

    const toggleCart = () => {
        setIsCartOpen(!isCartOpen);
    };

    const toggleUserMenu = () => {
        setIsUserMenuOpen(!isUserMenuOpen); // Växla användarmenyn
    };

    const toggleNav = () => {
        setIsNavOpen(!isNavOpen); // Växla navigationsmenyn
    };
    const closeNav = () => {
        setIsNavOpen(false); // Stänger navigationsmenyn
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
            setModalMessage(`Det finns bara ${maxQuantity} enheter i lager för den här produkten.`); // Ställ in meddelandet
            setShowModal(true); // Visa modalen
            updateQuantity(productId, maxQuantity);
        } else if (newQuantity < 1) {
            setModalMessage(`Antalet måste vara minst 1.`); // Ställ in meddelandet
            setShowModal(true); // Visa modalen
            updateQuantity(productId, 1);
        } else {
            updateQuantity(productId, newQuantity);
        }
    };

    // Funktion för att stänga modalen
    const handleCloseModal = () => {
        setShowModal(false);
    };

    return (
        <header>
            <div className="top-bar d-flex justify-content-between align-items-center py-2 px-4">
                <div className="phone-number">
                    <span>+46 123 456 789</span>
                </div>

                <div className="icons d-flex align-items-center">
                    {/* Login/Logout icon */}
                    {userEmail ? (
                        <div className="dropdown">
                            <button className="btn btn" onClick={toggleUserMenu}>
                                {userFirstName || 'Användare'}
                            </button>
                            {isUserMenuOpen && (
                                <div className="user-menu">
                                    <button className="btn btn" onClick={handleLogout}>Logga ut</button>
                                </div>
                            )}
                        </div>
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

                        {isCartOpen && (
                            <div className="cart-dropdown">
                                {cartItems.length === 0 ? (
                                    <p>Inga varor i varukorgen</p>
                                ) : (
                                    <div className="cart-content">
                                        {cartItems.map((item) => (
                                            <div key={item.product.id} className="cart-item">
                                                <img
                                                    src={item.product.image_url && item.product.image_url.length > 0 ? item.product.image_url[0] : 'https://via.placeholder.com/150'} 
                                                    alt={item.product.name}
                                                    className="cart-item-img"
                                                />
                                                <div className="cart-item-details">
                                                    <h4>{item.product.name}</h4>
                                                    <p>{(item.product.price * 1.25).toFixed(2)} kr</p>
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

                                <div className="cart-total">
                                    <h4>Total: {getTotalPriceWithTax()} SEK</h4>
                                </div>

                                <button className="btn-primary-cart" onClick={handleCheckout}>Till kassan</button>
                                <button className="btn-cancel-cart" onClick={toggleCart}>Avbryt</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="logo-container">
    <Link className="brand" to="/">
        <img src={logo} alt="logotype" />
    </Link>
</div>
<nav className="navbar navbar-expand-lg navbar-light">
    <div className="container d-flex justify-content-between align-items-center">
      

        {/* Hamburger button */}
        <button
            className="navbar-toggler"
            type="button"
            onClick={toggleNav}
            aria-controls="navbarNav"
            aria-expanded={isNavOpen}
            aria-label="Toggle navigation"
        >
            <span className="navbar-toggler-icon"></span>
        </button>
    </div>

    {/* Navigation links */}
    <div className={`collapse navbar-collapse justify-content-center ${isNavOpen ? 'show' : ''}`} id="navbarNav">
        <ul className="navbar-nav mb-2 mb-lg-0 text-center">
            <li className="nav-item">
                <Link className="nav-link" to="/" onClick={closeNav}>Hem</Link>
            </li>
            <li className="nav-item">
                <Link className="nav-link" to="/products" onClick={closeNav}>Produkter</Link>
            </li>
            <li className="nav-item">
                <Link className="nav-link" to="/about" onClick={closeNav}>Om</Link>
            </li>
            <li className="nav-item">
                <Link className="nav-link" to="/contact" onClick={closeNav}>Kontakt</Link>
            </li>
        </ul>
    </div>
</nav>

            {/* Modal för varning */}
            <Modal show={showModal} onHide={handleCloseModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Varning</Modal.Title>
                </Modal.Header>
                <Modal.Body>{modalMessage}</Modal.Body>
                <Modal.Footer>
                    <button className="btn btn-secondary" onClick={handleCloseModal}>
                        Stäng
                    </button>
                </Modal.Footer>
            </Modal>
        </header>
    );
}

















