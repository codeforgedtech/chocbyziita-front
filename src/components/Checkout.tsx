import React, { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../supabaseClient';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Checkout.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

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
  tax: number; // Momssatsen i databasen (som decimal, t.ex. 0.25 för 25%)
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
  const [isGuest, setIsGuest] = useState(false); // To check if the user is a guest

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const user = session.user;
        setUserEmail(user.email || null);
        setUserId(user.id);

        const { data: userData, error } = await supabase
          .from('users')
          .select('first_name, last_name, address, city, postal_code, country')
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
            email: user.email || '',
          }));
        }

        if (error) {
          console.error('Error fetching user data:', error.message);
        }
      } else {
        // If no session, set guest mode
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
    setError(null);

    // Ensure that the necessary information is collected
    if (!formData.email || !formData.address || !formData.city || !formData.postalCode || !formData.country) {
      toast.error('Alla fält är obligatoriska.');
      setLoading(false);
      return;
    }

    // Generate a new UUID for guest users
    const guestUserId = uuidv4();
    const customerNumber = 'G-' + guestUserId.substring(0, 8); // Generate a customer number

    // Upsert guest user data if not logged in
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
        }, { onConflict: 'id' }); // Handle conflict on ID

      if (userError) {
        setError(userError.message);
        setLoading(false);
        return;
      }
    }

    // Proceed with the order insertion using the user ID (either logged in or guest)
    const userIdentifier = isGuest ? guestUserId : userId; // Use guest user ID for the order if guest

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
        user_id: userIdentifier, // Use user ID for the order
        products,
        total_price: grandTotal,
        shipping_method: formData.shippingMethod,
        shipping_address: `${formData.address}, ${formData.city}, ${formData.postalCode}, ${formData.country}`,
        shipping_cost: shippingCost,
        status: 'pending',
        email: formData.email, // Ensure email is stored with the order
      })
      .select(); // Use select to get the inserted data, including order ID

    setLoading(false);

    if (orderError) {
      setError(orderError.message);
    } else {
      // Generate and save invoice number
      const invoiceNumber = generateInvoiceNumber();
      const orderId = orderData[0].id; // Assuming 'id' is returned from the inserted order

      const { error: invoiceError } = await supabase
        .from('orders')
        .update({ invoice_number: invoiceNumber })
        .eq('id', orderId);

      if (invoiceError) {
        console.error('Error saving invoice number:', invoiceError.message);
      } else {
        console.log('Invoice number saved successfully:', invoiceNumber);
      }

      // Navigate to order confirmation page
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
            shippingMethod: formData.shippingMethod,
            shippingCost,
            email: formData.email, // Include email in order confirmation
          },
        },
      });

      clearCart();
    }
  };

  const generateInvoiceNumber = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit number
    return `INV-${randomNum}`;
  };

  return (
    <div className="container-fluid custom-container mt-5 p-4 border rounded bg-light shadow">
      <ToastContainer />
      <div className="row">
        <div className="col-md-4 mb-4">
          <h4 className="mb-3">Beställningsinformation</h4>
          <form>
            <div className="form-group">
              <label htmlFor="firstName">Förnamn</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                className="form-control"
                value={formData.firstName}
                onChange={handleChange}
                required
                disabled={!isGuest} // Disable if logged in
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Efternamn</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                className="form-control"
                value={formData.lastName}
                onChange={handleChange}
                required
                disabled={!isGuest}
              />
            </div>
            <div className="form-group">
              <label htmlFor="address">Adress</label>
              <input
                type="text"
                id="address"
                name="address"
                className="form-control"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="city">Stad</label>
              <input
                type="text"
                id="city"
                name="city"
                className="form-control"
                value={formData.city}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="postalCode">Postnummer</label>
              <input
                type="text"
                id="postalCode"
                name="postalCode"
                className="form-control"
                value={formData.postalCode}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="country">Land</label>
              <input
                type="text"
                id="country"
                name="country"
                className="form-control"
                value={formData.country}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">E-post</label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="phoneNumber">Telefonnummer</label>
              <input
                type="text"
                id="phoneNumber"
                name="phoneNumber"
                className="form-control"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </div>
            <h4 className="mb-3">Betalinformation</h4>
            <div className="form-group">
              <label htmlFor="cardNumber">Kortnummer</label>
              <input
                type="text"
                id="cardNumber"
                name="cardNumber"
                className="form-control"
                value={formData.cardNumber}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="cardExpiry">Utgångsdatum (MM/ÅÅ)</label>
              <input
                type="text"
                id="cardExpiry"
                name="cardExpiry"
                className="form-control"
                value={formData.cardExpiry}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="cardCvc">CVC</label>
              <input
                type="text"
                id="cardCvc"
                name="cardCvc"
                className="form-control"
                value={formData.cardCvc}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="shippingMethod">Fraktmetod</label>
              <select
                id="shippingMethod"
                name="shippingMethod"
                className="form-control"
                value={formData.shippingMethod}
                onChange={handleShippingChange}
              >
                <option value="standard">Standard (50 kr)</option>
                <option value="express">Express (100 kr)</option>
              </select>
            </div>
            <button type="button" className="btn btn-primary" onClick={handleCheckout} disabled={loading}>
              {loading ? 'Bearbetar...' : 'Slutför Beställning'}
            </button>
            {error && <div className="alert alert-danger mt-2">{error}</div>}
          </form>
        </div>
        <div className="col-md-4 offset-md-1">
          <h4 className="mb-3">Varukorg</h4>
          <ul className="list-group">
            {cartItems.map((item) => (
              <li className="list-group-item" key={item.product.id}>
                {item.product.name} - {item.quantity} x {item.product.price.toFixed(2)} kr
              </li>
            ))}
          </ul>
          <div className="mt-3">
            <h5>Totalt: {totalPrice.toFixed(2)} kr</h5>
            <h5>Fraktkostnad: {shippingCost} kr</h5>
            <h5>Skatt: {calculateTotalTax().toFixed(2)} kr</h5>
            <h5>Totalt att betala: {calculateGrandTotal()} kr</h5>
          </div>
        </div>
      </div>
    </div>
  );
}
