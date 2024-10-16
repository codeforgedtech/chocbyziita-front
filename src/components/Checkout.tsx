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
import { Modal } from 'react-bootstrap'; // Import Modal from react-bootstrap

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
  const [showModal, setShowModal] = useState(false); // State for modal visibility

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
    setShowModal(true); // Show the loading modal
    setError(null);

    if (!formData.email || !formData.address || !formData.city || !formData.postalCode || !formData.country) {
      toast.error('Alla fält är obligatoriska.');
      setLoading(false);
      setShowModal(false); // Hide the modal if there's an error
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
        setShowModal(false); // Hide the modal if there's an error
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
        setShowModal(false); // Hide the modal if there's an error
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
    setShowModal(false); // Hide the modal after processing is complete

    if (orderError) {
      setError(orderError.message);
    } else {
      const invoiceNumber = generateInvoiceNumber();
      const orderId = orderData[0].id;

      const { error: invoiceError } = await supabase
        .from('orders')
        .update({ invoice_number: invoiceNumber })
        .eq('id', orderId);

      if (invoiceError) {
        console.error('Error saving invoice number:', invoiceError.message);
      }

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
    }
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
          <div className="card">
            <div className="card-header">
              <h5>Produkter i Kassan</h5>
            </div>
            <div className="card-body">
              {cartItems.length === 0 ? (
                <p className="text-center">Ingen produkter i kassan.</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Produkt</th>
                      <th>Antal</th>
                      <th>Pris</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map((item) => (
                      <tr key={item.product.id}>
                        <td>{item.product.name}</td>
                        <td>{item.quantity}</td>
                        <td>{(item.product.price * item.quantity).toFixed(2)} kr</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <p className="text-end">Totalt: {totalPrice.toFixed(2)} kr</p>
              <p className="text-end">Fraktkostnad: {shippingCost} kr</p>
              <p className="text-end"><strong>Att betala: {calculateGrandTotal()} kr</strong></p>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-12">
          <h5>Leveransinformation</h5>
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="form-row">
              <div className="form-group col-md-6">
                <label htmlFor="firstName"><FaUser /> Förnamn</label>
                <input
                  type="text"
                  className="form-control"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group col-md-6">
                <label htmlFor="lastName">Efternamn</label>
                <input
                  type="text"
                  className="form-control"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="address"><FaAddressCard /> Adress</label>
              <input
                type="text"
                className="form-control"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group col-md-6">
                <label htmlFor="city"><FaAddressCard /> Stad</label>
                <input
                  type="text"
                  className="form-control"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group col-md-6">
                <label htmlFor="postalCode">Postnummer</label>
                <input
                  type="text"
                  className="form-control"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="country">Land</label>
              <input
                type="text"
                className="form-control"
                name="country"
                value={formData.country}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email"><FaEnvelope /> E-post</label>
              <input
                type="email"
                className="form-control"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="phoneNumber"><FaPhone /> Telefonnummer</label>
              <input
                type="tel"
                className="form-control"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="shippingMethod">Fraktmetod</label>
              <select
                className="form-control"
                name="shippingMethod"
                value={formData.shippingMethod}
                onChange={handleShippingChange}
              >
                <option value="standard">Standard (50 kr)</option>
                <option value="express">Express (100 kr)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="cardNumber"><FaCreditCard /> Kortnummer</label>
              <input
                type="text"
                className="form-control"
                name="cardNumber"
                value={formData.cardNumber}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group col-md-6">
                <label htmlFor="cardExpiry">Utgångsdatum</label>
                <input
                  type="text"
                  className="form-control"
                  name="cardExpiry"
                  value={formData.cardExpiry}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group col-md-6">
                <label htmlFor="cardCvc">CVC</label>
                <input
                  type="text"
                  className="form-control"
                  name="cardCvc"
                  value={formData.cardCvc}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            <button
              className="btn btn-primary"
              onClick={handleCheckout}
              disabled={loading}
            >
              {loading ? 'Behandlar...' : 'Slutför köp'}
            </button>
          </form>
        </div>
      </div>

      <ToastContainer />

      {/* Loading Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static" keyboard={false}>
        <Modal.Header>
          <Modal.Title>Bearbetar din beställning...</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Vänligen vänta medan vi behandlar din beställning.</p>
          <div className="spinner-border" role="status">
            <span className="sr-only">Laddar...</span>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}



