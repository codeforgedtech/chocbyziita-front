import React, { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../supabaseClient';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Checkout.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { FaUser, FaEnvelope, FaPhone, FaAddressCard, FaCreditCard } from 'react-icons/fa';
import { Modal } from 'react-bootstrap';

interface FormData {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  email: string;
  postalCode: string;
  country: string;
  shippingMethod: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  phoneNumber: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  tax: number;
}

export default function Checkout() {
  const { cartItems, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    email: '',
    postalCode: '',
    country: '',
    shippingMethod: 'standard',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    phoneNumber: '',
  });

  const [loading, setLoading] = useState(false);
  const [shippingCost, setShippingCost] = useState(50);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const user = session.user;
        setUserEmail(user.email || null);
        setUserId(user.id);

        const { data: userData, error } = await supabase
          .from('users')
          .select('first_name, last_name, address, city, postal_code, country, phone_number')
          .eq('id', user.id)
          .single();

        if (userData) {
          setFormData((prevData) => ({
            ...prevData,
            firstName: userData.first_name || '',
            lastName: userData.last_name || '',
            address: userData.address || '',
            city: userData.city || '',
            postalCode: userData.postal_code || '',
            country: userData.country || '',
            phoneNumber: userData.phone_number || '',
            email: user.email || '',
          }));
        }

        if (error) {
          console.error('Error fetching user data:', error.message);
        }
      } else {
        setIsGuest(true);
        console.log('No logged-in session, user is a guest');
      }
    };

    fetchUserData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const method = e.target.value;
    setFormData((prevData) => ({ ...prevData, shippingMethod: method }));
    setShippingCost(method === 'express' ? 150 : 79);
  };

  const calculateProductTax = (product: Product) => {
    return product.price * (product.tax / 1); 
  };

  const calculateTotalTax = () => {
    return cartItems.reduce((total, item) => {
      const productTax = calculateProductTax(item.product);
      return total + productTax * item.quantity;
    }, 0);
  };

  const calculateTotalProductPrice = (): number => {
    return cartItems.reduce((total, item) => {
      const itemTotalPrice = item.quantity * item.product.price; 
      return total + itemTotalPrice;
    }, 0);
  };

  const calculateGrandTotal = (): number => {
    const totalProductPrice = calculateTotalProductPrice(); 
    const totalTax = calculateTotalTax(); 
    const grandTotal = totalProductPrice + totalTax + shippingCost; 
    return grandTotal;
  };

  const handleCheckout = async () => {
    setLoading(true);
    setShowModal(true);
    setError(null);

    if (!formData.email || !formData.address || !formData.city || !formData.postalCode || !formData.country) {
      toast.error('Alla fält är obligatoriska.');
      setLoading(false);
      setShowModal(false);
      return;
    }

    const guestUserId = uuidv4();
    const customerNumber = 'G-' + guestUserId.substring(0, 8);

    if (isGuest) {
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: guestUserId,
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          address: formData.address,
          city: formData.city,
          postal_code: formData.postalCode,
          country: formData.country,
          phone_number: formData.phoneNumber || '',
          customer_number: customerNumber,
        }, { onConflict: 'email' });

      if (userError) {
        setError(userError.message);
        setLoading(false);
        setShowModal(false);
        return;
      }
    } else {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          address: formData.address,
          city: formData.city,
          postal_code: formData.postalCode,
          country: formData.country,
          phone_number: formData.phoneNumber,
        })
        .eq('id', userId);

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        setShowModal(false);
        return;
      }
    }

    const userIdentifier = isGuest ? guestUserId : userId;

    const products = cartItems.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      tax: item.product.tax,
    }));

    const totalAmount = totalPrice + shippingCost;
    const grandTotal = parseFloat(calculateGrandTotal());

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userIdentifier,
        products,
        total_price: grandTotal,
        shipping_method: formData.shippingMethod,
        shipping_address: `${formData.address}, ${formData.city}, ${formData.postalCode}, ${formData.country}`,
        shipping_cost: shippingCost,
        status: 'pending',
        email: formData.email,
      })
      .select();

    setLoading(false);
    setShowModal(false);

    if (orderError) {
      setError(orderError.message);
      return;
    }

    const invoiceNumber = generateInvoiceNumber();
    const orderId = orderData[0].id;

    const { error: invoiceError } = await supabase
      .from('orders')
      .update({ invoice_number: invoiceNumber })
      .eq('id', orderId);

    if (invoiceError) {
      console.error('Error saving invoice number:', invoiceError.message);
    }

    await Promise.all(
      cartItems.map(async (item) => {
        const { error: updateStockError } = await supabase
          .from('products')
          .update({ stock: item.product.stock - item.quantity })
          .eq('id', item.product.id);

        if (updateStockError) {
          console.error(`Error updating stock for product ${item.product.id}:`, updateStockError.message);
        }
      })
    );

    navigate('/order-confirmation', {
      state: {
        orderData: {
          orderId,
          firstName: formData.firstName,
          lastName: formData.lastName,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country,
          phoneNumber: formData.phoneNumber,
          products,
          totalAmount,
          grandTotal,
          shippingCost,
          shippingMethod: formData.shippingMethod,
        },
      },
    });

    clearCart();
  };

  const generateInvoiceNumber = () => {
    const timestamp = Date.now().toString();
    return `INV-${timestamp}`;
  };

  return (
    <div className="container-fluid checkout-container mt-5 p-4 border rounded bg-light shadow">
      <div className="checkout-form">
        <h3>Leveransinformation</h3>
        <form onSubmit={(e) => { e.preventDefault(); handleCheckout(); }}>
          {/* Personlig information */}
          <div className="form-group">
            <label htmlFor="firstName"><FaUser /> Förnamn</label>
            <input type="text" id="firstName" name="firstName" className="form-control" value={formData.firstName} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="lastName"><FaUser /> Efternamn</label>
            <input type="text" id="lastName" name="lastName" className="form-control" value={formData.lastName} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="email"><FaEnvelope /> E-post</label>
            <input type="email" id="email" name="email" className="form-control" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="phoneNumber"><FaPhone /> Telefonnummer</label>
            <input type="text" id="phoneNumber" name="phoneNumber" className="form-control" value={formData.phoneNumber} onChange={handleChange} />
          </div>

          {/* Adressinformation */}
          <div className="form-group">
            <label htmlFor="address"><FaAddressCard /> Adress</label>
            <input type="text" id="address" name="address" className="form-control" value={formData.address} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="city">Stad</label>
            <input type="text" id="city" name="city" className="form-control" value={formData.city} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="postalCode">Postnummer</label>
            <input type="text" id="postalCode" name="postalCode" className="form-control" value={formData.postalCode} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="country">Land</label>
            <input type="text" id="country" name="country" className="form-control" value={formData.country} onChange={handleChange} required />
          </div>

          {/* Fraktmetod */}
          <div className="form-group">
            <label>Fraktmetod</label>
            <div className="form-check">
              <input className="form-check-input" type="radio" id="standard" name="shippingMethod" value="standard" checked={formData.shippingMethod === 'standard'} onChange={handleShippingChange} />
              <label className="form-check-label" htmlFor="standard">Standard (79 SEK)</label>
            </div>
            <div className="form-check">
              <input className="form-check-input" type="radio" id="express" name="shippingMethod" value="express" checked={formData.shippingMethod === 'express'} onChange={handleShippingChange} />
              <label className="form-check-label" htmlFor="express">Express (150 SEK)</label>
            </div>
          </div>

          {/* Betalningsinformation */}
          <div className="form-group">
            <label htmlFor="cardNumber"><FaCreditCard /> Kortnummer</label>
            <input type="text" id="cardNumber" name="cardNumber" className="form-control" value={formData.cardNumber} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="cardExpiry">Utgångsdatum</label>
            <input type="text" id="cardExpiry" name="cardExpiry" className="form-control" value={formData.cardExpiry} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="cardCvc">CVC</label>
            <input type="text" id="cardCvc" name="cardCvc" className="form-control" value={formData.cardCvc} onChange={handleChange} required />
          </div>

          {/* Slutför köp-knappen */}
          <button type="submit" className="btn checkout-button" disabled={loading}>
            {loading ? 'Bearbetar...' : 'Slutför köp'}
          </button>
        </form>

        {/* Modal för bearbetning */}
        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Bearbetar betalning</Modal.Title>
          </Modal.Header>
          <Modal.Body>Vänligen vänta medan vi bearbetar din betalning...</Modal.Body>
        </Modal>

        {/* Felmeddelande */}
        {error && <div className="alert alert-danger mt-3">{error}</div>}
      </div>

      {/* Sammanfattning av varukorgen */}
      <div className="cart-summary">
        <h3>Produkter i Kassan</h3>
        <ul className="list-group">
          {cartItems.map((item) => (
            <li key={item.product.id} className="list-group-item d-flex justify-content-between align-items-center">
              <div className="product-item">
                <img src={item.product.image_url && item.product.image_url.length > 0 ? item.product.image_url[0] : 'https://via.placeholder.com/150'} alt={item.product.name} className="img-fluid rounded shadow-sm" />
                <div>
                  <strong>{item.product.name}</strong>
                  <div>{item.quantity} x {(item.product.price * (1 + item.product.tax)).toFixed(2)} kr</div>
                </div>
              </div>
              {(item.quantity * item.product.price * (1 + item.product.tax)).toFixed(2)} kr
            </li>
          ))}
        </ul>

        <div className="total-section">
          <div><strong>Fraktkostnad:</strong> {shippingCost} SEK</div>
          <div><strong>Totalt:</strong> {calculateGrandTotal().toFixed(2)} SEK</div>
        </div>
      </div>
    </div>
  );
}





