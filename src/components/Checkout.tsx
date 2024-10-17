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
    setShippingCost(method === 'express' ? 100 : 50);
  };

  const calculateProductTax = (product: Product) => {
    return product.price * product.tax;
  };

  const calculateTotalTax = () => {
    return cartItems.reduce((total, item) => {
      const productTax = calculateProductTax(item.product);
      return total + productTax * item.quantity;
    }, 0);
  };

  const calculateGrandTotal = () => {
    return (totalPrice + shippingCost + calculateTotalTax()).toFixed(2);
  };

  const handleCheckout = async () => {
    setLoading(true);
    setShowModal(true);
    setError(null);
  
    // Validera formuläret
    if (!formData.email || !formData.address || !formData.city || !formData.postalCode || !formData.country) {
      toast.error('Alla fält är obligatoriska.');
      setLoading(false);
      setShowModal(false);
      return;
    }
  
    const guestUserId = uuidv4();
    const customerNumber = 'G-' + guestUserId.substring(0, 8);
  
    if (isGuest) {
      // Spara gäst-användare
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
      // Uppdatera befintlig användare
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
  
    // Förbered orderprodukter
    const products = cartItems.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      tax: item.product.tax,
    }));
  
    const totalAmount = totalPrice + shippingCost;
    const grandTotal = parseFloat(calculateGrandTotal());
  
    // Skapa beställning
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
  
    // Uppdatera fakturanummer
    const { error: invoiceError } = await supabase
      .from('orders')
      .update({ invoice_number: invoiceNumber })
      .eq('id', orderId);
  
    if (invoiceError) {
      console.error('Error saving invoice number:', invoiceError.message);
    }
  
    // Minska produktantalet i lagret
    await Promise.all(
      cartItems.map(async (item) => {
        const { error: updateStockError } = await supabase
          .from('products')
          .update({ stock: item.product.stock - item.quantity }) // Justera här till den korrekta fältbeteckningen för lager
          .eq('id', item.product.id);
  
        if (updateStockError) {
          console.error(`Error updating stock for product ${item.product.id}:`, updateStockError.message);
        }
      })
    );
  
    // Navigera till orderbekräftelse
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
  
    // Töm varukorgen
    clearCart();
  };

  const generateInvoiceNumber = () => {
    const timestamp = Date.now().toString();
    return `INV-${timestamp}`;
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Kassa</h2>
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header">
              <h5>Produkter i Kassan</h5>
            </div>
            <div className="card-body">
              {cartItems.length === 0 ? (
                <p className="text-center">Din kundvagn är tom.</p>
              ) : (
                <ul className="list-group">
                  {cartItems.map((item) => (
                    <li key={item.product.id} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{item.product.name}</strong>
                        <div>{item.quantity} x {item.product.price} SEK</div>
                      </div>
                      <span>{(item.quantity * item.product.price).toFixed(2)} SEK</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3">
                <strong>Fraktkostnad:</strong> {shippingCost} SEK
              </div>
              <div className="mt-2">
                <strong>Totalt:</strong> {calculateGrandTotal()} SEK
              </div>
            </div>
          </div>
        </div>
      </div>

      <h5>Leveransinformation</h5>
      <form onSubmit={(e) => { e.preventDefault(); handleCheckout(); }}>
        <div className="mb-3">
          <label className="form-label"><FaUser /> Förnamn:</label>
          <input type="text" className="form-control" name="firstName" value={formData.firstName} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label"><FaUser /> Efternamn:</label>
          <input type="text" className="form-control" name="lastName" value={formData.lastName} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label"><FaAddressCard /> Adress:</label>
          <input type="text" className="form-control" name="address" value={formData.address} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label"><FaAddressCard /> Stad:</label>
          <input type="text" className="form-control" name="city" value={formData.city} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label"><FaEnvelope /> E-post:</label>
          <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label"><FaAddressCard /> Postnummer:</label>
          <input type="text" className="form-control" name="postalCode" value={formData.postalCode} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label"><FaAddressCard /> Land:</label>
          <input type="text" className="form-control" name="country" value={formData.country} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Fraktmetod:</label>
          <select className="form-select" name="shippingMethod" value={formData.shippingMethod} onChange={handleShippingChange}>
            <option value="standard">Standard (50 SEK)</option>
            <option value="express">Express (100 SEK)</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label"><FaPhone /> Telefonnummer:</label>
          <input type="tel" className="form-control" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required />
        </div>
        <h5>Betalningsinformation</h5>
        <div className="mb-3">
          <label className="form-label"><FaCreditCard /> Kortnummer:</label>
          <input type="text" className="form-control" name="cardNumber" value={formData.cardNumber} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Utgångsdatum:</label>
          <input type="text" className="form-control" name="cardExpiry" value={formData.cardExpiry} onChange={handleChange} placeholder="MM/ÅÅ" required />
        </div>
        <div className="mb-3">
          <label className="form-label">CVC:</label>
          <input type="text" className="form-control" name="cardCvc" value={formData.cardCvc} onChange={handleChange} required />
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Bearbetar...' : 'Slutför köp'}
        </button>
      </form>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Laddar...</Modal.Title>
        </Modal.Header>
        <Modal.Body>Vänligen vänta medan vi behandlar din beställning.</Modal.Body>
      </Modal>
      <ToastContainer />
    </div>
  );
}




