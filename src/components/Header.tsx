import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../supabaseClient'; 
import './Header.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect, useState } from 'react';

export default function Header() {
    const { cartItems } = useCart();
    const [userEmail, setUserEmail] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) {
                console.error('Error fetching session:', error.message);
                return; // Avbryt om det finns ett fel
            }

            if (session) {
                const user = session.user;
                setUserEmail(user.email || null);
            } else {
                setUserEmail(null); // Ingen användare inloggad
            }
        };

        fetchUserData();
    }, []);

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error logging out:', error.message);
        } else {
            setUserEmail(null); // Rensa email efter utloggning
            console.log('Användaren har loggats ut');
        }
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
            <div className="container">
                <Link className="navbar-brand" to="/">
                    <h1>Praline Shop</h1>
                </Link>

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

                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                        <li className="nav-item">
                            <Link className="nav-link" to="/">Startsida</Link>
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
                        <li className="nav-item">
                            {userEmail ? (
                                <Link className="nav-link" to="#" onClick={handleLogout}>Logga ut</Link> // Använd onClick för att logga ut
                            ) : (
                                <Link className="nav-link" to="/login">Logga in</Link>
                            )}
                        </li>
                    </ul>

                    <div className="d-flex">
                        <Link className="btn btn-outline-primary" to="/cart">
                            🛒 ({cartItems.reduce((total, item) => total + item.quantity, 0)})
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}








