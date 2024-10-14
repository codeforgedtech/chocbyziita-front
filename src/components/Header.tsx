import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../supabaseClient'; 
import './Header.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaRegUser } from "react-icons/fa";
import logo from"../assets/Choc by Z.png"
import { FaSearch , FaHeart, FaShoppingBag } from "react-icons/fa";
import { useEffect, useState } from 'react';

export default function Header() {
    const { cartItems } = useCart();
    const [userEmail, setUserEmail] = useState<string | null>(null);

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
        {/* Logotypen */}
        <div className="logo text-center">
            <Link className="navbar-brand" to="/">
               <img src={logo} alt="logotype"/>
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

                    {/* Cart icon */}
                    <Link className="btn btn position-relative" to="/cart">
                    <FaShoppingBag/>
                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                            {cartItems.reduce((total, item) => total + item.quantity, 0)}
                        </span>
                    </Link>
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










