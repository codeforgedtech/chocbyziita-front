import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../supabaseClient'; 
import './Header.css';
import { useNavigate } from 'react-router-dom'; 
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaRegUser, FaSearch, FaRegHeart, FaShoppingBag, FaTrash } from "react-icons/fa";
import logo from "../assets/Chocbyzbrown.svg";
import { useEffect, useState } from 'react';
import { Modal, ListGroup } from 'react-bootstrap';

interface Product {
  id: number;
  name: string;
  price: number;
  image_url: string;
  stock: number;
  tax?: number; // Add tax property
}

export default function Header() {
    const { cartItems, removeFromCart, updateQuantity } = useCart();
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [userFirstName, setUserFirstName] = useState<string | null>(null);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isNavOpen, setIsNavOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
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
                
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('first_name')
                    .eq('id', user.id)
                    .single();

                if (userError) {
                    console.error('Error fetching user data:', userError.message);
                } else {
                    setUserFirstName(userData?.first_name || null);
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
            setUserFirstName(null);
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
        setIsUserMenuOpen(!isUserMenuOpen);
    };

    const toggleNav = () => {
        setIsNavOpen(!isNavOpen);
    };

    const closeNav = () => {
        setIsNavOpen(false);
    };

    // Update the total price calculation to include specific tax rates
    const getTotalPriceWithTax = () => {
        return cartItems.reduce((total, item) => {
            const productTaxRate = item.product.tax || 0; // Use the tax from product or default to 0
            const subtotal = item.product.price * item.quantity;
            return total + subtotal * (1 + productTaxRate); // Apply product-specific tax
        }, 0).toFixed(2);
    };

    const handleQuantityChange = (productId: number, newQuantity: number, maxQuantity: number) => {
        if (newQuantity > maxQuantity) {
            setModalMessage(`Det finns bara ${maxQuantity} enheter i lager för den här produkten.`);
            setShowModal(true);
            updateQuantity(productId, maxQuantity);
        } else if (newQuantity < 1) {
            setModalMessage(`Antalet måste vara minst 1.`);
            setShowModal(true);
            updateQuantity(productId, 1);
        } else {
            updateQuantity(productId, newQuantity);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const closeSearch = () => {
        setIsSearchOpen(false);
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();

        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .ilike('name', `%${searchTerm}%`);

        if (error) {
            console.error('Error fetching products:', error.message);
        } else {
            setSearchResults(products as Product[]);
        }
    };

    const toggleSearch = () => {
        setIsSearchOpen(!isSearchOpen);
    };

    return (
        <header>
            <div className="top-bar d-flex justify-content-between align-items-center py-2 px-4">
                <div className="phone-number">
                    <span>+46 123 456 789</span>
                </div>

                <div className="icons d-flex align-items-center">
                    {userEmail ? (
                        <div className="dropdown">
                            <button className="btn btn custom-link" onClick={toggleUserMenu}>
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

                    <button className="btn btn" onClick={toggleSearch}>
                        <FaSearch />
                    </button>

                    <Link className="btn btn" to="/favorites">
                        <FaRegHeart />
                    </Link>

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
                                                    <p>{(item.product.price * (1 + (item.product.tax || 0))).toFixed(2)} kr</p> {/* Calculate with tax */}
                                                    <p>Antal: {item.quantity}</p>
                                                </div>
                                                <div className='cart-item-actions'>
                                                    <div className="cart-item-transperant">
                                                        <button onClick={() => handleQuantityChange(item.product.id, item.quantity - 1, item.product.stock)}>-</button>
                                                        <span className='cart-item-transperant'>{item.quantity}</span>
                                                        <button onClick={() => handleQuantityChange(item.product.id, item.quantity + 1, item.product.stock)}>+</button>
                                                    </div>
                                                </div>
                                                <div onClick={() => removeFromCart(item.product.id)} className='cart-item-trash'>
                                                    <FaTrash />
                                                </div>
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

            <div className="logo-container text-center">
                <Link className="brand" to="/">
                    <img src={logo} alt="logotype" className="img-fluid" />
                </Link>
            </div>

            <nav className="navbar navbar-expand-lg navbar-light">
                <div className="container-fluid">
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

                    <div className={`collapse navbar-collapse ${isNavOpen ? 'show' : ''}`} id="navbarNav">
                    <button className="close-menu-btn" onClick={closeNav}>×</button>
                   
                        <ul className="navbar-nav mx-auto">
                        <div className="mobile-logo">
                            <img src={logo} alt="Logotype" className="mobile-logo-img" />
                        </div>
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
                </div>
            </nav>

            {/* Sökfält som fälls ner */}
            {isSearchOpen && (
                <div className={`search-bar ${isSearchOpen ? 'show' : ''}`}>
                    <form onSubmit={handleSearch}>
                        <input 
                            type="text"
                            className="form-control"
                            placeholder="Sök produkter..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button type="submit" className="btn btn-primary">Sök</button>
                    </form>

                    {/* Visa sökresultat */}
                    <div className="search-results">
                        {searchResults.length === 0 ? (
                            <p>Inga produkter matchade din sökning.</p>
                        ) : (
                            <ListGroup>
                                {searchResults.map((product) => (
                                    <ListGroup.Item key={product.id}>
                                        <Link to={`/product/${product.id}`} className="text-decoration-none search-link" onClick={closeSearch}>
                                            {product.name}
                                        </Link>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        )}
                    </div>
                </div>
            )}

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




















