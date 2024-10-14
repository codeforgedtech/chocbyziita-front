import React, { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../supabaseClient';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Checkout.css';
import { ToastContainer ,toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

interface FormData {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  email:string;
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
    email:'',
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
  const [isGuest, setIsGuest] = useState(false); // För att kontrollera om det är en gäst

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
            email:'',
            phoneNumber: '',
            cardExpiry: '',
            cardCvc: '',
          });
        }

        if (error) {
          console.error('Fel vid hämtning av användarinformation:', error.message);
        }
      } else {
        // Om ingen inloggad session, aktivera gästläge
        setIsGuest(true);
        console.log('Ingen inloggad session, användaren är gäst');
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
  
    // Upsert guest user data
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
  
    // Proceed with the order insertion using the guest user ID
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
        user_id: guestUserId, // Use guest user ID for the order
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
    const randomNum = Math.floor(100000 + Math.random() * 900000); // Generera ett 6-siffrigt nummer
    return `INV-${randomNum}`;
  };

  return (
    <div className="container-fluid custom-container mt-5 p-4 border rounded bg-light shadow">
      <ToastContainer />
      <div className="row">
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
                {cartItems.map((item, index) => (
                  <tr key={index}>
                    <td>{item.product.name}</td>
                    <td>{item.quantity}</td>
                    <td>{item.product.price.toFixed(2)}</td>
                    <td>{(item.product.price * item.product.tax).toFixed(2)}</td>
                    <td>
                      {((item.product.price + item.product.price * item.product.tax) * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="d-flex justify-content-between mb-2">
              <strong>Totalt varor:</strong>
              <span>{totalPrice.toFixed(2)} SEK</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <strong>Fraktkostnad:</strong>
              <span>{shippingCost} SEK</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <strong>Moms totalt:</strong>
              <span>{calculateTotalTax().toFixed(2)} SEK</span>
            </div>
            <hr />
            <div className="d-flex justify-content-between">
              <strong>Att betala:</strong>
              <strong>{calculateGrandTotal()} SEK</strong>
            </div>
          </div>
        </div>
        <div className="col-md-8">
          <h4 className="mb-3">Kundinformation</h4>
          <div className="card p-4 shadow-sm">
            <form>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="firstName">Förnamn</label>
                  <input
                    type="text"
                    className="form-control"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="lastName">Efternamn</label>
                  <input
                    type="text"
                    className="form-control"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Guest Checkout Option */}
              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="guestCheckout"
                  checked={isGuest}
                  onChange={() => setIsGuest(!isGuest)}
                />
                <label className="form-check-label" htmlFor="guestCheckout">
                  Genomför som gäst
                </label>
              </div>
              <div className="mb-3">
<label htmlFor="email">E-post:</label>
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
              <div className="mb-3">
                <label htmlFor="address">Adress</label>
                <input
                  type="text"
                  className="form-control"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="city">Stad</label>
                  <input
                    type="text"
                    className="form-control"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="postalCode">Postnummer</label>
                  <input
                    type="text"
                    className="form-control"
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="mb-3">
                <label htmlFor="country">Land</label>
                <input
                  type="text"
                  className="form-control"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="phoneNumber">Telefonnummer (valfritt)</label>
                <input
                  type="tel"
                  className="form-control"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-4">
                <label htmlFor="shippingMethod">Fraktmetod</label>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="shippingMethod"
                    id="standardShipping"
                    value="standard"
                    checked={formData.shippingMethod === 'standard'}
                    onChange={handleShippingChange}
                    required
                  />
                  <label className="form-check-label" htmlFor="standardShipping">
                    Standardfrakt (50 SEK)
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="shippingMethod"
                    id="expressShipping"
                    value="express"
                    checked={formData.shippingMethod === 'express'}
                    onChange={handleShippingChange}
                    required
                  />
                  <label className="form-check-label" htmlFor="expressShipping">
                    Expressfrakt (100 SEK)
                  </label>
                </div>
              </div>

              <h4 className="mb-3">Betalning</h4>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="cardNumber">Kortnummer</label>
                  <input
                    type="text"
                    className="form-control"
                    id="cardNumber"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-3 mb-3">
                  <label htmlFor="cardExpiry">Giltighetstid</label>
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
                <div className="col-md-3 mb-3">
                  <label htmlFor="cardCvc">CVC</label>
                  <input
                    type="text"
                    className="form-control"
                    id="cardCvc"
                    name="cardCvc"
                    value={formData.cardCvc}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {error && <p className="text-danger">{error}</p>}

              <button
                type="button"
                className="btn btn-primary btn-lg btn-block"
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? 'Skickar beställning...' : 'Slutför beställning'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

