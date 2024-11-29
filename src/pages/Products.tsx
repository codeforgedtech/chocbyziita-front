import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useCart } from '../contexts/CartContext';
import { Product } from '../types';
import './Products.css'; 
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { Modal, Button } from 'react-bootstrap'; // Importera modal och knapp

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false); // State för modal
  const [modalMessage, setModalMessage] = useState(''); // State för meddelande
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
  const { addToCart, cartItems } = useCart();

  // Get the number of products to display based on screen width
  const getNumberOfProductsToShow = () => {
    return window.innerWidth < 768 ? 2 : 4; // 2 för mobil, 6 för desktop
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.from('products').select('*');
        if (error) throw error;

        setQuantities(
          data.reduce((acc: { [key: number]: number }, product: Product) => {
            acc[product.id] = 1; // Set default quantity to 1
            return acc;
          }, {})
        );
        
        // Set products based on the screen size
        setProducts(data.slice(0, getNumberOfProductsToShow()) as Product[]); 
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();

    // Add event listener to handle window resizing
    const handleResize = () => {
      setProducts(prevProducts => prevProducts.slice(0, getNumberOfProductsToShow())); // Adjust product display on resize
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize); // Cleanup
    };
  }, []);

  const calculatePriceWithTax = (price: number, taxRate: number) => {
    return (price * (1 + taxRate)).toFixed(2);
  };

  const getCartItemQuantity = (productId: number) => {
    const cartItem = cartItems.find(item => item.product.id === productId);
    return cartItem ? cartItem.quantity : 0;
  };

  if (loading) return <p className="loading-text text-center">Laddar produkter...</p>;
  if (error) return <p className="error-text text-center">{error}</p>;

  return (
    <>
      <h2 className="custom-padding-top">Senaste produkterna</h2>
      <div className="custom-container"> {/* Använd anpassad container */}

        {products.map((product) => {
          const currentCartQuantity = getCartItemQuantity(product.id);
          const isAddToCartDisabled = currentCartQuantity >= product.stock; // Disable if cart quantity meets or exceeds stock
          const isOutOfStock = product.stock === 0; // Check if the product is out of stock

          return (
            <div key={product.id} className="col">
              <div className="card" key={product.id} >
                {/* Product Image */}
                <Link to={`/product/${product.id}`} className="text-decoration-none">
                  <img
                    src={product.image_url && product.image_url.length > 0 ? product.image_url[0] : 'https://via.placeholder.com/300x300'}
                    alt={product.name}
                    className="img-thumbnail"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/300x300';
                    }} />
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
                  <p className="card-text fw-bold text-dark mb-6 custom-text">
                    {calculatePriceWithTax(product.price, product.tax)} kr
                  </p>
                </div>

                <button
                  className="custom-cart"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isOutOfStock) {
                      addToCart(product, quantities[product.id]);
                      setModalMessage(`${product.name} har lagts till i kundvagnen.`);
                      setShowModal(true); // Visa modalen
                    } else {
                      setModalMessage('Produkten är slut i lager.');
                      setShowModal(true); // Visa modalen
                    }
                  }}
                  disabled={isOutOfStock || isAddToCartDisabled} // Disable if out of stock or cart has max quantity
                >
                  Köp
                </button>
              </div>
            </div>
          );
        })}

        {/* Modal för att visa meddelande om att produkten har lagts till */}
        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Information</Modal.Title>
          </Modal.Header>
          <Modal.Body>{modalMessage}</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Stäng
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  );
}








































