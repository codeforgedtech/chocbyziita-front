import { useCart } from '../contexts/CartContext';
import './Cart.css'; // Importera anpassad CSS
import { FaTrashAlt } from "react-icons/fa";
import { useNavigate } from 'react-router-dom'; // Importera useNavigate
import 'bootstrap/dist/css/bootstrap.min.css'; // Importera Bootstrap

export default function Cart() {
  const { cartItems, removeFromCart, updateQuantity } = useCart();
  const navigate = useNavigate(); // Initialize useNavigate

  const TAX_RATE = 0.25; // Exempel på 25% moms

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      const subtotal = item.product.price * item.quantity;
      return total + subtotal; // Beräkna total utan moms
    }, 0);
  };

  const getTotalPriceWithTax = () => {
    const totalPrice = getTotalPrice();
    return totalPrice * (1 + TAX_RATE); // Beräkna total med moms
  };

  const handleCheckout = () => {
    // Navigera till Checkout med cartItems
    navigate('/checkout', { state: { cartItems } });
  };

  return (
    <div className="container-fluid custom-container mt-5 p-4 border rounded bg-light shadow-lg">
      <h1 className="text-center mb-4">Din varukorg</h1>

      {cartItems.length === 0 ? (
        <div className="text-center">
          <p className="alert alert-warning">Inga varor i varukorgen</p>
        </div>
      ) : (
        <div>
          {cartItems.map((item) => {
            const subtotal = item.product.price * item.quantity; // Subtotal utan moms
            const subtotalWithTax = subtotal * (1 + TAX_RATE); // Subtotal med moms
            const priceWithTax = item.product.price * (1 + TAX_RATE); // Beräkna pris med moms

            return (
              <div key={item.product.id} className="row cart-item mb-4 py-3 align-items-center border-bottom">
                <div className="col-md-2 d-flex justify-content-center">
                  <img
                    src={item.product.image_url && item.product.image_url.length > 0 ? item.product.image_url[0] : 'https://via.placeholder.com/150'} // Visa endast första bilden
                    alt={item.product.name}
                    className="img-fluid rounded shadow-sm"
                  />
                </div>
                <div className="col-md-6">
                  <h2 className="h5 mb-2">{item.product.name}</h2>
                  <p className="text-muted">Pris (inkl. moms): {priceWithTax.toFixed(2)} SEK</p>
                  
                  <p className="text-muted">Subtotal: {subtotalWithTax.toFixed(2)} SEK (inkl. moms)</p>
                </div>
                <div className="col-md-4 d-flex justify-content-md-end justify-content-start"> {/* Justera flexbox-beteende */}
                  <div className="quantity-control d-flex align-items-center">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.product.id, Number(e.target.value))}
                      min="1"
                      className="form-control w-50 text-center"
                    />
                    <button
                      className="btn btn-outline-danger ms-2" // Lägger till marginal mellan antalet och knappen
                      onClick={() => removeFromCart(item.product.id)}
                    >
                      <FaTrashAlt size={20} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="row mt-4">
            <div className="col-md-6 offset-md-6">
              <h3 className="text-end">Total: {getTotalPriceWithTax().toFixed(2)} SEK (inkl. moms)</h3>
              <button
                className="btn btn-primary w-100 btn-lg mt-3"
                onClick={handleCheckout}
              >
                Gå till kassan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



















