import React from 'react';
import { FaFacebook, FaInstagram } from 'react-icons/fa';
import './Footer.css'; // Se till att du har en CSS-fil för stilar

const Footer = () => {
    return (
        <footer>
            <div className="container">
                <div className="row py-3">
                  
                    <div className="col text-start">
                        <h3>Choc By Z</h3>
                        <p>Adress: Bergviksvägen 11, 813 91 Hofors</p>
                        <p>Org. nr: 760101-XXXX</p>
                    </div>

                    {/* Mitten kolumn - Sociala medier och nyhetsbrev */}
                    <div className="col text-center">
                        <h3>Följ oss</h3>
                        <div className="social-icons mb-2">
                            <a href="#" className="mx-2"><FaFacebook /></a>
                            <a href="#" className="mx-2"><FaInstagram /></a><p/>
                 CodeForged Tech
                        </div>
                      
                    </div>

                    {/* Höger kolumn - Kontaktinformation */}
                    <div className="col text-start">
                        <h3>Kontakt</h3>
                        <p>Email: kontakt@ziita.se</p>
                        <p>Telefon: +46 290-861 23</p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;



