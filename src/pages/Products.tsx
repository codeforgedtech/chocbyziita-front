import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useCart } from '../contexts/CartContext';
import { Product } from '../types';
import { Link } from 'react-router-dom';
import './Products.css'; // Custom CSS
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
  const { addToCart } = useCart();

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
        setProducts(data as Product[]);
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

  if (loading) return <p className="loading-text">Laddar produkter...</p>;
  if (error) return <p className="error-text">{error}</p>;

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-5">Utvalda Produkter</h1>
      {products.length === 0 ? (
        <p className="text-center">Inga produkter tillgängliga just nu.</p>
      ) : (
        <div className="row g-5"> {/* Ändrad till g-5 för mer mellanrum */}
          {products.map((product) => (
            <div key={product.id} className="col-6"> {/* Kolumner för två kort per rad */}
              <div className="card product-card shadow-sm h-100">
                <Link to={`/product/${product.id}`} className="text-decoration-none text-dark position-relative">
                  <img
                    src={product.image_url && product.image_url.length > 0 ? product.image_url[0] : 'https://via.placeholder.com/300x300'}
                    alt={product.name}
                    className="card-img-top"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/300x300';
                    }}
                  />
                  {product.stock === 0 && (
                    <span className="badge bg-danger position-absolute top-0 start-50 translate-middle rounded-pill">
                      Slut i lager
                    </span>
                  )}
                  <div className="card-body">
                    <h5 className="card-title">{product.name}</h5>
                  </div>
                </Link>
                <div className="card-footer bg-transparent border-0 d-flex justify-content-between align-items-center">
                  <p className="card-text fw-bold text-dark mb-0">
                    {calculatePriceWithTax(product.price, product.tax)} kr
                  </p>
                  <div className="input-group quantity-input small-quantity">
                    <button
                      className="btn btn-outline btn-sm custom-btn"
                      type="button"
                      onClick={() => handleQuantityChange(product.id, -1)}
                      disabled={quantities[product.id] <= 1 || product.stock === 0}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      className="form-control form-control-sm text-center custom-input"
                      min="1"
                      max={product.stock}
                      value={quantities[product.id]}
                      readOnly
                    />
                    <button
                      className="btn btn-outline btn-sm custom-btn"
                      type="button"
                      onClick={() => handleQuantityChange(product.id, 1)}
                      disabled={quantities[product.id] >= product.stock || product.stock === 0}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="d-flex justify-content-center mt-2">
                  <button
                    className="btn btn-custom btn-sm w-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (product.stock > 0) {
                        addToCart(product, quantities[product.id]);
                        showToast(`${product.name} har lagts till i kundvagnen.`);
                      } else {
                        showToast('Produkten är slut i lager.');
                      }
                    }}
                    disabled={product.stock === 0}
                  >
                    Lägg i varukorg
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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





























