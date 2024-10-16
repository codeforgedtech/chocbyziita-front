import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // För omdirigering
import { supabase } from '../supabaseClient';
import { Modal, Button } from 'react-bootstrap'; // För modal
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Login() {
    const [email, setEmail] = useState<string>(''); 
    const [password, setPassword] = useState<string>(''); 
    const [loading, setLoading] = useState<boolean>(false); 
    const [showModal, setShowModal] = useState<boolean>(false); // Hantera modalens synlighet
    const navigate = useNavigate(); // Omdirigering till huvudsidan

    const isEmailValid = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isPasswordValid = (password: string): boolean => password.length >= 8;

    const handleSignIn = async (): Promise<void> => {
        if (!isEmailValid(email)) {
            alert('Ogiltig e-postadress');
            return;
        }
        if (!isPasswordValid(password)) {
            alert('Lösenordet måste vara minst 8 tecken långt');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password.trim(),
        });
        setLoading(false);

        if (error) {
            console.error('Error details:', error);
            alert(error.message);
        } else {
            setShowModal(true); // Visa modal vid lyckad inloggning
        }
    };

    const handleModalClose = () => {
        setShowModal(false); // Stäng modalen
        navigate('/'); // Omdirigera till huvudsidan ("/")
    };

    return (
        <div className="container-fluid custom-container mt-5 p-4 border rounded bg-light shadow">
            <div className="auth-form p-4 border rounded bg-light shadow-lg">
                <h1 className="text-center mb-4">Logga in</h1>
                <div className="mb-3">
                    <input
                        type="email"
                        className="form-control"
                        placeholder="E-postadress"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)} 
                    />
                </div>
                <div className="mb-3">
                    <input
                        type="password"
                        className="form-control"
                        placeholder="Lösenord"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <button 
                    className="btn btn-primary btn-block mb-2" 
                    onClick={handleSignIn} 
                    disabled={loading}
                >
                    {loading ? 'Loggar in...' : 'Logga in'}
                </button>

                <div className="text-center mt-3">
                    <p>Inget konto? 
                        <button 
                            className="btn btn-link" 
                            onClick={() => navigate('/signup')} // Navigera till registreringssidan
                        >
                            Registrera dig här
                        </button>
                    </p>
                </div>
            </div>

            {/* Modal */}
            <Modal show={showModal} onHide={handleModalClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Inloggningen lyckades</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Du har loggat in framgångsrikt på Zittas kök. Du omdirigeras snart till huvudsidan.</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={handleModalClose}>
                        Fortsätt
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}


