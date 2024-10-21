import React from 'react';
import { FaFacebook, FaInstagram} from 'react-icons/fa';
import './Footer.css'; // Se till att du har en CSS-fil för stilar

const Footer = () => {
    return (
        <footer>
            <div className="container">
                <div className="row py-3">
                    {/* Vänster kolumn - Företagsnamn och adress */}
                    <div className="col text-start">
                        <h5>Choc By Z</h5>
                        <p>Adress: Exempelgatan 1, 123 45 Staden</p>
                        <p>Org. nr: 123456-7890</p>
                    </div>

                    {/* Mitten kolumn - Sociala medier och nyhetsbrev */}
                    <div className="col text-center">
                        <h5>Följ oss</h5>
                        <div className="social-icons">
                            <a href="#" className="mx-2"><FaFacebook /></a>
                         
                            <a href="#" className="mx-2"><FaInstagram /></a>
                            
                        </div>
                        <h6>Nyhetsbrev</h6>
                        <form>
                            <input
                                type="email"
                                className="form-control mb-2"
                                placeholder="Din e-post"
                                required
                            />
                            <button type="submit" className="btn btn-primary">Prenumerera</button>
                        </form>
                    </div>

                    {/* Höger kolumn - Kontaktinformation */}
                    <div className="col text-start footer-size">
                        <h5>Kontakt</h5>
                        <p>Email: kontakt@ziita.se</p>
                        <p>Telefon: +46 123 456 789</p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;


