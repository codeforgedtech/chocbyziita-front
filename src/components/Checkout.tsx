import React, { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../supabaseClient';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Checkout.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

interface FormData {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
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
  tax: number;  // Momssatsen i databasen (som decimal, t.ex. 0.25 för 25%)
}

export default function Checkout() {
  const { cartItems, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
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
          setFormData({
            firstName: userData.first_name || '',
            lastName: userData.last_name || '',
            address: userData.address || '',
            city: userData.city || '',
            postalCode: userData.postal_code || '',
            country: userData.country || '',
            shippingMethod: 'standard',
            cardNumber: '',
            phoneNumber: '',
            cardExpiry: '',
            cardCvc: '',
          });
        }

        if (error) {
          console.error('Fel vid hämtning av användarinformation:', error.message);
        }
      } else {
        console.error('Ingen inloggad session');
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
    if (!userId) {
      toast.error('Du måste logga in för att genomföra en beställning.');
      return;
    }
  
    setLoading(true);
    setError(null);
  
    if (!userEmail) {
      toast.error('E-postadress saknas för användaren.');
      setLoading(false);
      return;
    }
  
    const products = cartItems.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      tax: item.product.tax,
    }));
  
    const totalAmount = totalPrice + shippingCost;
    const grandTotal = parseFloat(calculateGrandTotal());
  
    // Update or insert user data
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: userEmail,
        first_name: formData.firstName,
        last_name: formData.lastName,
        address: formData.address,
        city: formData.city,
        postal_code: formData.postalCode,
        country: formData.country,
        phone_number: formData.phoneNumber || '',
      }, { onConflict: 'id' });
  
    if (userError) {
      setError(userError.message);
      setLoading(false);
      return;
    }
  
    // Insert order into database
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        products,
        total_price: grandTotal,
        shipping_method: formData.shippingMethod,
        shipping_address: `${formData.address}, ${formData.city}, ${formData.postalCode}, ${formData.country}`,
        shipping_cost: shippingCost,
        status: 'pending',
      })
      .select(); // Use select to get the inserted data, including order ID
  
    setLoading(false);
  
    if (orderError) {
      setError(orderError.message);
    } else {
      // Generate invoice number
      const invoiceNumber = generateInvoiceNumber();
  
      // Save the invoice number in the database
      const orderId = orderData[0].id;  // Assuming 'id' is returned from the inserted order
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
          },
        },
      });
  
      clearCart();
    }
  };
  
  // Helper function to generate invoice number
  const generateInvoiceNumber = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit number
    return `INV-${randomNum}`;
  };

  return (
    <div className="container-fluid custom-container mt-5 p-4 border rounded bg-light shadow">
      <ToastContainer />
      <div className="row">
        {/* Beställningsöversikten */}
        <div className="col-md-4 mb-4">
          <h4 className="mb-3">Beställningsöversikt</h4>
          <div className="card p-3 shadow-sm">
            <table className="table table-striped mb-3">
              <thead>
                <tr>
                  <th scope="col">Produkt</th>
                  <th scope="col">Antal</th>
                  <th scope="col">Pris SEK</th>
                  <th scope="col">Moms SEK</th>
                  <th scope="col">Totalt SEK</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item, index) => {
                  const itemTax = calculateProductTax(item.product) * item.quantity;
                  const itemTotal = (item.product.price * item.quantity) + itemTax;
                  return (
                    <tr key={index}>
                      <td>{item.product.name}</td>
                      <td>{item.quantity}</td>
                      <td>{(item.product.price * item.quantity).toFixed(2)}</td>
                      <td>{itemTax.toFixed(2)}</td>
                      <td>{itemTotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <ul className="list-group list-group-flush mb-3">
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Fraktkostnad</span>
                <strong>{shippingCost.toFixed(2)} SEK</strong>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span>Total moms</span>
                <strong>{calculateTotalTax().toFixed(2)} SEK</strong>
              </li>
            </ul>

            <ul className="list-group list-group-flush">
              <li className="list-group-item d-flex justify-content-between align-items-center">
                <span><strong>Totalt inkl. moms</strong></span>
                <strong>{calculateGrandTotal()} SEK</strong>
              </li>
            </ul>
          </div>
        </div>

        {/* Formulärsektionen */}
        <div className="col-md-8">
          <h1 className="mb-4">Kassa</h1>
          {userEmail && (
            <div className="alert alert-info">
              <strong>E-postadress:</strong> {userEmail}
            </div>
          )}
          {error && <div className="alert alert-danger">{error}</div>}
          <form>
            {/* Fraktinformation */}
            <div className="mb-4">
              <h3>Fraktinformation</h3>
              <div className="mb-3">
                <label className="form-label">Fraktmetod</label>
                <div>
                  <div className="form-check form-check-inline">
                    <input
                      type="radio"
                      name="shippingMethod"
                      value="standard"
                      checked={formData.shippingMethod === 'standard'}
                      onChange={handleShippingChange}
                      className="form-check-input"
                      id="standardShipping"
                    />
                    <label className="form-check-label" htmlFor="standardShipping">
                      Standardfrakt (50 SEK)
                    </label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input
                      type="radio"
                      name="shippingMethod"
                      value="express"
                      checked={formData.shippingMethod === 'express'}
                      onChange={handleShippingChange}
                      className="form-check-input"
                      id="expressShipping"
                    />
                    <label className="form-check-label" htmlFor="expressShipping">
                      Expressfrakt (100 SEK)
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Personinformation */}
            <div className="mb-4">
              <h3>Personinformation</h3>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="firstName" className="form-label">Förnamn</label>
                  <input
                    type="text"
                    className="form-control"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Ange förnamn"
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="lastName" className="form-label">Efternamn</label>
                  <input
                    type="text"
                    className="form-control"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Ange efternamn"
                    required
                  />
                </div>
              </div>
              <div className="mb-3">
                <label htmlFor="phoneNumber" className="form-label">Telefonnummer</label>
                <input
                  type="tel"
                  className="form-control"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="Ange telefonnummer"
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="address" className="form-label">Adress</label>
                <input
                  type="text"
                  className="form-control"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Ange adress"
                  required
                />
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="city" className="form-label">Stad</label>
                  <input
                    type="text"
                    className="form-control"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Ange stad"
                    required
                  />
                </div>
                <div className="col-md-3 mb-3">
                  <label htmlFor="postalCode" className="form-label">Postnummer</label>
                  <input
                    type="text"
                    className="form-control"
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    placeholder="Ange postnummer"
                    required
                  />
                </div>
                <div className="col-md-3 mb-3">
                  <label htmlFor="country" className="form-label">Land</label>
                  <input
                    type="text"
                    className="form-control"
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="Ange land"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Betalningsinformation */}
            <div className="mb-4">
              <h3>Betalningsinformation</h3>
              <div className="mb-3">
                <label htmlFor="cardNumber" className="form-label">Kortnummer</label>
                <input
                  type="text"
                  className="form-control"
                  id="cardNumber"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleChange}
                  placeholder="Ange kortnummer"
                  required
                />
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="cardExpiry" className="form-label">Utgångsdatum (MM/ÅÅ)</label>
                  <input
                    type="text"
                    className="form-control"
                    id="cardExpiry"
                    name="cardExpiry"
                    value={formData.cardExpiry}
                    onChange={handleChange}
                    placeholder="MM/ÅÅ"
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="cardCvc" className="form-label">CVC</label>
                  <input
                    type="text"
                    className="form-control"
                    id="cardCvc"
                    name="cardCvc"
                    value={formData.cardCvc}
                    onChange={handleChange}
                    placeholder="CVC"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Beställningsknapp */}
            <div className="text-center">
              <button
                type="button"
                className="btn btn-primary btn-lg px-5"
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? 'Bearbetar...' : 'Slutför Beställning'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
