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
      // Minska lagret för varje produkt i kundvagnen
      for (const item of cartItems) {
        const productId = item.product.id;
        const newStock = item.product.stock - item.quantity; // Update to use 'stock'
  
        await supabase
          .from('products')
          .update({ stock: newStock }) // Update to use 'stock'
          .eq('id', productId);
      }
  
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
    <div className="container custom-container mt-5 p-4 border rounded bg-light shadow-lg">
      <ToastContainer />
      {/* User Status Section */}
      <div className="mb-4 text-center">
        {isGuest ? (
          <div className="alert alert-warning">Du checkar ut som gäst</div>
        ) : (
          <div className="alert alert-success">Du är inloggad som {userEmail}</div>
        )}
      </div>

      <h2 className="text-center mb-4">Checkout</h2>
      
      <div className="row">
        <div className="col-md-6">
          {/* Shipping Information */}
          <h5>Fraktinformation</h5>
          <form>
            <div className="form-group mb-2">
              <label htmlFor="firstName">Förnamn</label>
              <input
                type="text"
                className="form-control"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                disabled={!isGuest} // Disable for logged-in users
              />
            </div>

            <div className="form-group mb-2">
              <label htmlFor="lastName">Efternamn</label>
              <input
                type="text"
                className="form-control"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                disabled={!isGuest} // Disable for logged-in users
              />
            </div>

            <div className="form-group mb-2">
              <label htmlFor="address">Address</label>
              <input
                type="text"
                className="form-control"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={!isGuest} // Disable for logged-in users
              />
            </div>

            <div className="form-group mb-2">
              <label htmlFor="city">Stad</label>
              <input
                type="text"
                className="form-control"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                disabled={!isGuest} // Disable for logged-in users
              />
            </div>

            <div className="form-group mb-2">
              <label htmlFor="postalCode">Postnummer</label>
              <input
                type="text"
                className="form-control"
                id="postalCode"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                disabled={!isGuest} // Disable for logged-in users
              />
            </div>

            <div className="form-group mb-2">
              <label htmlFor="country">Land</label>
              <input
                type="text"
                className="form-control"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                disabled={!isGuest} // Disable for logged-in users
              />
            </div>

            <div className="form-group mb-2">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                className="form-control"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isGuest} // Disable for logged-in users
              />
            </div>
            
            <div className="form-group mb-2">
              <label htmlFor="phoneNumber">Telefonnummer</label>
              <input
                type="text"
                className="form-control"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                disabled={!isGuest} // Disable for logged-in users
              />
            </div>
          </form>
        </div>

        {/* Payment Information */}
        <div className="col-md-6">
          <h5>Betalningsinformation</h5>
          <form>
            <div className="form-group mb-2">
              <label htmlFor="cardNumber">Kortnummer</label>
              <input
                type="text"
                className="form-control"
                id="cardNumber"
                name="cardNumber"
                value={formData.cardNumber}
                onChange={handleChange}
                placeholder="1234 5678 9101 1121"
              />
            </div>

            <div className="form-group mb-2">
              <label htmlFor="cardExpiry">Giltigt till</label>
              <input
                type="text"
                className="form-control"
                id="cardExpiry"
                name="cardExpiry"
                value={formData.cardExpiry}
                onChange={handleChange}
                placeholder="MM/YY"
              />
            </div>

            <div className="form-group mb-2">
              <label htmlFor="cardCvc">CVC</label>
              <input
                type="text"
                className="form-control"
                id="cardCvc"
                name="cardCvc"
                value={formData.cardCvc}
                onChange={handleChange}
                placeholder="CVC"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Shipping Method and Order Summary */}
      <div className="row mt-4">
        <div className="col-md-6">
          <h5>Fraktmetod</h5>
          <div className="form-check">
            <input
              type="radio"
              className="form-check-input"
              id="standardShipping"
              name="shippingMethod"
              value="standard"
              checked={formData.shippingMethod === 'standard'}
              onChange={handleShippingChange}
            />
            <label className="form-check-label" htmlFor="standardShipping">
              Standardfrakt - 50 SEK
            </label>
          </div>
          <div className="form-check">
            <input
              type="radio"
              className="form-check-input"
              id="expressShipping"
              name="shippingMethod"
              value="express"
              checked={formData.shippingMethod === 'express'}
              onChange={handleShippingChange}
            />
            <label className="form-check-label" htmlFor="expressShipping">
              Expressfrakt - 100 SEK
            </label>
          </div>
        </div>

        {/* Order Summary */}
        <div className="col-md-6">
          <h5>Orderöversikt</h5>
          <ul className="list-group">
            {cartItems.map((item, index) => (
              <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                {item.product.name} x {item.quantity}
                <span>{(item.product.price * item.quantity).toFixed(2)} SEK</span>
              </li>
            ))}
            <li className="list-group-item d-flex justify-content-between align-items-center">
              Frakt
              <span>{shippingCost} SEK</span>
            </li>
            <li className="list-group-item d-flex justify-content-between align-items-center">
              Moms
              <span>{calculateTotalTax().toFixed(2)} SEK</span>
            </li>
            <li className="list-group-item d-flex justify-content-between align-items-center">
              Totalt
              <span>{calculateGrandTotal()} SEK</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-4 text-center">
        <button
          className="btn btn-primary btn-lg"
          onClick={handleCheckout}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Slutför köp'}
        </button>
      </div>
      {error && <div className="text-danger mt-3 text-center">{error}</div>}
    </div>
  );
}

