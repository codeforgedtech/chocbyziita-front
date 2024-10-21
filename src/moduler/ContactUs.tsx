// ContactUs.tsx
import React, { useState } from 'react';
import './ContactUs.css'; // Importera en CSS-fil för stilning

const ContactUs: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
  
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, message }),
      });
  
      if (response.ok) {
        setSuccessMessage('Ditt meddelande har skickats!');
        setEmail('');
        setMessage('');
      } else {
        throw new Error('Något gick fel, försök igen.');
      }
    } catch (error) {
      const errorMessage = (error as Error).message || 'Något gick fel';
      setErrorMessage(errorMessage);
    }
  };

  return (
    <div className="contact-container d-flex flex-column flex-md-row align-items-center">
      <img 
        src="https://via.placeholder.com/150" // Ersätt med din bild-URL
        alt="Kontakta oss"
        className="contact-image mb-3 mb-md-0 me-md-3"
      />
      <div className="contact-text">
        <h2>Kontakta oss</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Din e-postadress"
            required
            className="form-control"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ditt meddelande"
            required
            className="form-control"
            rows={4}
          />
          <button type="submit" className="btn btn-primary custom-contact">Skicka meddelande</button>
        </form>
        {successMessage && <p className="success-message">{successMessage}</p>}
        {errorMessage && <p className="error-message">{errorMessage}</p>}
      </div>
    </div>
  );
};

export default ContactUs;
