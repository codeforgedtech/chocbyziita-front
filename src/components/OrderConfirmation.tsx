import React from 'react';
import { useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './OrderConfirmation.css'; // För att inkludera anpassad CSS-styling

interface Product {
  name: string;
  price: number; // Exklusive moms
  quantity: number;
}

interface OrderData {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
  products: Product[];
  totalAmount: number; // Exklusive moms, beräknad med moms nedan
  shippingMethod: string;
  shippingCost: number; // Exklusive moms, beräknad med moms nedan
}

const TAX_RATE = 0.25; // Anta 25 % moms

const OrderConfirmation: React.FC = () => {
  const location = useLocation();
  const { orderData } = location.state as { orderData: OrderData }; // Hämta orderdata

  // Kontrollera att orderData och dess värden är definierade
  const totalAmount = orderData?.totalAmount ?? 0; // Fallback till 0 om totalAmount är undefined
  const shippingCostWithTax = orderData.shippingCost; // Fraktkostnad inklusive moms

  const calculateTotalWithTax = () => {
    // Räkna ut totalbeloppet med moms för produkter och fraktkostnad
    const productsTotalWithTax = orderData.products.reduce((total, product) => {
      return total + product.price * (1 + TAX_RATE) * product.quantity; // Lägg till moms på varje produkt
    }, 0);
    
    return productsTotalWithTax + shippingCostWithTax; // Totala summan inklusive moms
  };

  const totalWithTax = calculateTotalWithTax(); // Totalt belopp med moms

  return (
    <div className="container-fluid custom-container mt-5 p-4 border rounded bg-light shadow">
      <h1 className="text-center mb-4 text-primary">Tack för din beställning, {orderData.firstName} {orderData.lastName}!</h1>

      <div className="alert alert-info">
        <h4 className="alert-heading">Beställningsdetaljer</h4>
        <p><strong>Leveransadress:</strong> {orderData.address}, {orderData.city}, {orderData.postalCode}, {orderData.country}</p>
        <p><strong>Telefonnummer:</strong> {orderData.phoneNumber}</p>
      </div>

      <h3 className="mt-4">Beställda produkter:</h3>
      <ul className="list-group mb-3">
        {orderData.products.map((product, index) => (
          <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
            <span>{product.name} ({product.quantity} x {(product.price * (1 + TAX_RATE)).toFixed(2)} SEK)</span>
            <span><strong>{(product.quantity * product.price * (1 + TAX_RATE)).toFixed(2)} SEK</strong></span> {/* Visar totalpriset per produkt inklusive moms */}
          </li>
        ))}
      </ul>

      <div className="d-flex justify-content-between font-weight-bold mb-2">
        <span>Fraktmetod:</span>
        <span>{orderData.shippingMethod}</span>
      </div>
      <div className="d-flex justify-content-between font-weight-bold mb-2">
        <span>Fraktkostnad:</span>
        <span>{shippingCostWithTax.toFixed(2)} SEK</span> {/* Fraktkostnad inklusive moms */}
      </div>

      <h2 className="mt-3 text-success">Totalt belopp: {totalWithTax.toFixed(2)} SEK</h2> {/* Totala summan för hela beställningen inklusive moms */}
      
      <div className="mt-4">
        <h3>Betalningsinformation</h3>
        <p>Din betalning har genomförts framgångsrikt!</p>
        <p>Tack för att du handlar hos oss. Din order kommer att behandlas omedelbart.</p>
      </div>

      <div className="text-center mt-4">
        <a href="/" className="btn btn-primary btn-lg">Tillbaka till startsidan</a>
      </div>
    </div>
  );
};

export default OrderConfirmation;



