// Footer.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css'; // CSS för footern

const Footer: React.FC = () => {
    return (
        <footer className="footer bg-dark text-light py-3">
            <div className="container text-center">
                <p>&copy; {new Date().getFullYear()} Praline Shop. All Rights Reserved.</p>
                <ul className="list-inline">
                    <li className="list-inline-item">
                        <Link to="/about" className="text-light">About Us</Link>
                    </li>
                    <li className="list-inline-item">
                        <Link to="/contact" className="text-light">Contact</Link>
                    </li>
                    <li className="list-inline-item">
                        <Link to="/privacy" className="text-light">Privacy Policy</Link>
                    </li>
                </ul>
            </div>
        </footer>
    );
};

export default Footer;
