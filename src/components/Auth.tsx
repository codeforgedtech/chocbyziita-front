import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';


import 'bootstrap/dist/css/bootstrap.min.css';

export default function Auth() {
    const [email, setEmail] = useState<string>(''); 
    const [password, setPassword] = useState<string>(''); 
    const [loading, setLoading] = useState<boolean>(false); 
    const [isLogin, setIsLogin] = useState<boolean>(true); 

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) {
                console.error('Error fetching session:', sessionError.message);
                return; 
            }
            if (session) {
                const { user } = session; 
                setEmail(user.email || ''); 
            } else {
                console.log('Ingen aktiv session, användare är inte inloggad.');
            }
        };

        fetchUserData();
    }, []);

    const isEmailValid = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isPasswordValid = (password: string): boolean => password.length >= 8;

    const handleSignUp = async (): Promise<void> => {
        if (!isEmailValid(email)) {
            alert('Ogiltig e-postadress');
            return;
        }
        if (!isPasswordValid(password)) {
            alert('Lösenordet måste vara minst 8 tecken långt');
            return;
        }
    
        setLoading(true);
    
        // Registrera användaren
        const { data, error: signupError } = await supabase.auth.signUp({
            email: email.trim(),
            password: password.trim(),
        });
    
        if (signupError) {
            setLoading(false);
            console.error('Error during signup:', signupError);
            alert(signupError.message);
            return;
        }
    
        const user = data.user;
    
        if (user) {
            // Lägg till användaren i 'users'-tabellen utan lösenord
            const { error: dbError } = await supabase
                .from('users')
                .insert([{
                    id: user.id, 
                    email: user.email,
                    created_at: new Date().toISOString(), 
                    first_name: '', // Tom sträng för förnamn
                    last_name: '',  // Tom sträng för efternamn
                    phone_number: '', // Tom sträng för telefonnummer
                    address: '', // Tom sträng för adress
                }]);
    
            setLoading(false);
    
            if (dbError) {
                console.error('Error inserting user into database:', dbError);
                alert('Registrering lyckades, men kunde inte spara användarinformation i databasen.');
            } else {
                alert('Kontrollera din e-post för bekräftelselänken!');
            }
        } else {
            setLoading(false);
            console.error('No user object returned during signup.');
            alert('Registreringen lyckades, men ingen användare kunde läggas till i databasen.');
        }
    };

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
            alert('Inloggningen lyckades!');
        }
    };

    return (
        <div className="container-fluid custom-container mt-5 p-4 border rounded bg-light shadow">
            <div className="auth-form p-4 border rounded bg-light shadow-lg">
                <div className="text-center mb-4">
                    <button 
                        className={`btn btn-link ${isLogin ? 'active' : ''}`} 
                        onClick={() => setIsLogin(true)}
                    >
                        Logga in
                    </button>
                    <span className="mx-2">|</span>
                    <button 
                        className={`btn btn-link ${!isLogin ? 'active' : ''}`} 
                        onClick={() => setIsLogin(false)}
                    >
                        Registrera
                    </button>
                </div>

                {isLogin ? (
                    <>
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
                    </>
                ) : (
                    <>
                        <h1 className="text-center mb-4">Registrera</h1>
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
                            className="btn btn-secondary btn-block" 
                            onClick={handleSignUp} 
                            disabled={loading}
                        >
                            {loading ? 'Registrerar...' : 'Registrera'}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}











