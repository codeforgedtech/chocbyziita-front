import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useCart } from '../contexts/CartContext';
import { Product } from '../types';
import './Products.css'; 
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';


export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});

  const { addToCart, cartItems } = useCart(); // Get cartItems from context

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.from('products').select('*');
        if (error) throw error;

        setQuantities(
          data.reduce((acc: { [key: number]: number }, product: Product) => {
            acc[product.id] = 1;
            return acc;
          }, {})
        );
        setProducts(data.slice(0, 4) as Product[]); // Begränsar till max 4 produkter
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const calculatePriceWithTax = (price: number, taxRate: number) => {
    return (price * (1 + taxRate)).toFixed(2);
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    const toastElement = document.getElementById('toast');
    if (toastElement) {
      const toast = new window.bootstrap.Toast(toastElement);
      toast.show();
    }
  };

  const handleQuantityChange = (productId: number, amount: number) => {
    setQuantities((prev) => {
      const newQuantity = (prev[productId] || 1) + amount;
      return {
        ...prev,
        [productId]: Math.max(1, Math.min(newQuantity, products.find(p => p.id === productId)?.stock || 1)),
      };
    });
  };

  const getCartItemQuantity = (productId: number) => {
    const cartItem = cartItems.find(item => item.product.id === productId);
    return cartItem ? cartItem.quantity : 0;
  };

  if (loading) return <p className="loading-text text-center">Laddar produkter...</p>;
  if (error) return <p className="error-text text-center">{error}</p>;

  return (
    <div className="container mt-5 px-4 custom-container">
      <h2 className="text-center mb-6 custom-padding-top">Utvalda produkter</h2>
      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4">
        {products.map((product) => {
          const currentCartQuantity = getCartItemQuantity(product.id);
          const isAddToCartDisabled = currentCartQuantity >= product.stock; // Disable if cart quantity meets or exceeds stock
          const isOutOfStock = product.stock === 0; // Check if the product is out of stock

          return (
            <div key={product.id} className="col">
              <div className="card h-100 shadow-sm border-1">
                {/* Product Image */}
                <Link to={`/product/${product.id}`} className="text-decoration-none">
                  <img
                    src={product.image_url && product.image_url.length > 0 ? product.image_url[0] : 'https://via.placeholder.com/300x300'}
                    alt={product.name}
                    className="card-img-top img-fluid"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/300x300';
                    }}
                  />
                </Link>

                {/* Product Description */}
                <div className="card-body text-center">
                  <h5 className="card-title text-dark">{product.name}</h5>
                 
                  <p className="text-muted small">
                    {isOutOfStock ? 'Slut i lager' : `I lager (${product.stock} st)`}
                  </p>
                </div>

                {/* Card Footer with Quantity Controls and Add to Cart Button */}
                <div className="card-footer d-flex justify-content-between align-items-center p-2">
                  {/* Hide Quantity Controls if out of stock */}
                  {!isOutOfStock && (
                    <div className="input-group input-group-sm w-50">
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() => handleQuantityChange(product.id, -1)}
                        disabled={quantities[product.id] <= 1}
                      >
                        <i className="fas fa-minus"></i>
                      </button>
                      <input
                        type="number"
                        className="form-control text-center"
                        min="1"
                        max={product.stock}
                        value={quantities[product.id]}
                        readOnly
                      />
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() => handleQuantityChange(product.id, 1)}
                        disabled={quantities[product.id] >= product.stock}
                      >
                        <i className="fas fa-plus"></i>
                      </button>
                    </div>
                  )}

<p className="card-text fw-bold text-dark mb-6 custom-text">{calculatePriceWithTax(product.price, product.tax)} kr</p>
                  
                </div>
                <button
                    className="custom-cart"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isOutOfStock) {
                        addToCart(product, quantities[product.id]);
                        showToast(`${product.name} har lagts till i kundvagnen.`);
                      } else {
                        showToast('Produkten är slut i lager.');
                      }
                    }}
                    disabled={isOutOfStock || isAddToCartDisabled} // Disable if out of stock or cart has max quantity
                  >
                   Lägg i Varukorgen
                  </button>
              </div>
              
            </div>
          );
        })}
      </div>

      {/* Toast notification */}
      <div aria-live="polite" aria-atomic="true" className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 11 }}>
        <div id="toast" className="toast align-items-center text-white bg-primary border-0" role="alert" aria-live="assertive" aria-atomic="true">
          <div className="d-flex">
            <div className="toast-body">{toastMessage}</div>
            <button type="button" className="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
        </div>
      </div>
    </div>
  );
}




































