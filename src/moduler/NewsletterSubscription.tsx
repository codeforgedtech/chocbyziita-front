// NewsletterSubscription.tsx
import React, { useState } from 'react';
import './NewsletterSubscription.css'; // Importera en CSS-fil för stilning

const NewsletterSubscription: React.FC = () => {
  const [email, setEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
  
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
  
      if (response.ok) {
        setSuccessMessage('Du har prenumererat på nyhetsbrevet!');
        setEmail('');
      } else {
        throw new Error('Något gick fel, försök igen.');
      }
    } catch (error) {
      const errorMessage = (error as Error).message || 'Något gick fel';
      setErrorMessage(errorMessage);
    }
  };

  return (
    <div className="newsletter-container d-flex flex-column flex-md-row align-items-center">
      <img 
        src="https://via.placeholder.com/150" // Ersätt med din bild-URL
        alt="Nyhetsbrev"
        className="newsletter-image mb-3 mb-md-0 me-md-3"
      />
      <div className="newsletter-text">
        <h2>Prenumerera på vårt nyhetsbrev</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Din e-postadress"
            required
            className="form-control"
          />
          <button type="submit" className="btn btn-primary">Prenumerera</button>
        </form>
        {successMessage && <p className="success-message">{successMessage}</p>}
        {errorMessage && <p className="error-message">{errorMessage}</p>}
      </div>
    </div>
  );
};

export default NewsletterSubscription;

