import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import 'bootstrap/dist/css/bootstrap.min.css';
import './OrderConfirmation.css';

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
  orderId: number; // Se till att detta matchar datatypen i din databas
  phoneNumber: string;
  products: Product[];
  totalAmount: number; // Exklusive moms
  shippingMethod: string;
  shippingCost: number; // Exklusive moms
}

const TAX_RATE = 0.25; // Anta 25 % moms

const OrderConfirmation: React.FC = () => {
  const location = useLocation();
  const { orderData } = location.state as { orderData?: OrderData } || {}; // Fallback to an empty object

  useEffect(() => {
    console.log('Order Data:', orderData);
    if (orderData?.orderId) {
      const invoiceNumber = generateInvoiceNumber();
      saveInvoiceNumber(invoiceNumber);
    } else {
      console.error('Order ID is undefined, cannot save invoice number.');
    }
  }, [orderData]);

  const generateInvoiceNumber = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000); // Genererar ett 6-siffrigt nummer
    return `INV-${randomNum}`;
  };

  const saveInvoiceNumber = async (invoiceNumber: string) => {
    if (!orderData?.orderId) {
      console.error('Order ID is undefined');
      return;
    }

    const { error } = await supabase
      .from('orders')
      .update({ invoice_number: invoiceNumber })
      .eq('id', orderData.orderId); // Kontrollera att 'id' är rätt datatyp

    if (error) {
      console.error('Error updating invoice number:', error.message);
    } else {
      console.log('Invoice number saved successfully:', invoiceNumber);
    }
  };

  // Räkna ut totalbeloppet med moms
  const calculateTotalWithTax = () => {
    const productsTotalWithTax = orderData?.products.reduce((total, product) => {
      return total + product.price * (1 + TAX_RATE) * product.quantity; // Lägg till moms på varje produkt
    }, 0) || 0; // Fallback to 0 if orderData is undefined

    return productsTotalWithTax + (orderData?.shippingCost || 0); // Use fallback for shipping cost
  };

  const totalWithTax = calculateTotalWithTax(); // Totalt belopp med moms

  // Check if orderData is available
  if (!orderData) {
    return (
      <div className="container mt-5">
        <h2 className="text-danger">Ingen beställningsinformation tillgänglig.</h2>
        <p>Vänligen kontrollera din beställning och försök igen.</p>
        <a href="/" className="btn btn-primary">Tillbaka till startsidan</a>
      </div>
    );
  }

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
        <span>{orderData.shippingCost.toFixed(2)} SEK</span> {/* Fraktkostnad inklusive moms */}
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





