import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Modal, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ToastContainer, toast } from 'react-toastify';

export default function SignUp() {
    const [formData, setFormData] = useState<{
        firstName: string;
        lastName: string;
        email: string;
        password: string;
    }>({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState<boolean>(false);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const isEmailValid = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isPasswordValid = (password: string): boolean => password.length >= 8;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleSignUp = async (): Promise<void> => {
        if (!isEmailValid(formData.email)) {
            alert('Ogiltig e-postadress');
            return;
        }
        if (!isPasswordValid(formData.password)) {
            alert('Lösenordet måste vara minst 8 tecken långt');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data, error: signupError } = await supabase.auth.signUp({
                email: formData.email.trim(),
                password: formData.password.trim(),
            });

            if (signupError) {
                throw signupError;
            }

            const user = data.user;

            if (user) {
                // Generate a unique customer number starting with "R-"
                const randomDigits = Math.floor(100000 + Math.random() * 900000).toString();
const customerNumber = `R-${randomDigits}`;

                const { error: dbError } = await supabase
                    .from('users')
                    .insert([{
                        id: user.id,
                        email: user.email,
                        created_at: new Date().toISOString(),
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        phone_number: '', // Optional field
                        address: '',
                        city: '',
                        postal_code: '',
                        country: '',
                        customer_number: customerNumber, // Add customer number here
                    }]);

                if (dbError) {
                    console.error('Error inserting user into database:', dbError);
                    toast.error('Registreringen lyckades, men kunde inte spara användarinformation i databasen.');
                } else {
                    setShowModal(true);
                }
            } else {
                throw new Error('Ingen användare kunde registreras.');
            }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error('Error during signup:', err.message);
            setError(err.message || 'Ett oväntat fel inträffade.');
            toast.error(err.message || 'Ett oväntat fel inträffade.');
        } finally {
            setLoading(false);
        }
    };

    const handleModalClose = () => {
        setShowModal(false);
        navigate('/login');
    };

    return (
        <div className="container-fluid custom-container mt-4 p-4 border rounded bg-light shadow">
            <ToastContainer />
            <div className="auth-form p-4 border rounded bg-light shadow-lg">
                <h1 className="text-center mb-4">Registrera</h1>
                <div className="mb-3">
                    <input
                        type="text"
                        name="firstName"
                        className="form-control"
                        placeholder="Förnamn"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-3">
                    <input
                        type="text"
                        name="lastName"
                        className="form-control"
                        placeholder="Efternamn"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-3">
                    <input
                        type="email"
                        name="email"
                        className="form-control"
                        placeholder="E-postadress"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-3">
                    <input
                        type="password"
                        name="password"
                        className="form-control"
                        placeholder="Lösenord"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>
                <button
                    className="btn btn-secondary btn-block"
                    onClick={handleSignUp}
                    disabled={loading}
                >
                    {loading ? 'Registrerar...' : 'Registrera'}
                </button>
                {error && <div className="alert alert-danger mt-2">{error}</div>}
            </div>

            {/* Modal */}
            <Modal show={showModal} onHide={handleModalClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Registrering slutförd</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Du har registrerat dig på Zittas kök. Kontrollera din e-post för att bekräfta din registrering.</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={handleModalClose}>
                        Gå till inloggning
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}




