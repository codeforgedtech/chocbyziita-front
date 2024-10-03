import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Här skulle du inkludera din autentisering
    // Simulera inloggning
    if (email === 'ch@star78.se' && password === '12345678') {
      // Navigera till dashboard om inloggning är framgångsrik
      navigate('/admin/dashboard');
    } else {
      alert('Felaktig e-post eller lösenord.'); // För enkelhetens skull, hantera fel på detta sätt.
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center">Admin Logga in</h2>
      <form onSubmit={handleLogin} className="mt-4">
        <div className="mb-3">
          <label htmlFor="email" className="form-label">E-post</label>
          <input
            type="email"
            className="form-control"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">Lösenord</label>
          <input
            type="password"
            className="form-control"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary w-100">Logga in</button>
      </form>
    </div>
  );
};

export default AdminLogin;
