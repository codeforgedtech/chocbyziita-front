import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useCart } from '../contexts/CartContext';
import { Product } from '../types';
import { Link } from 'react-router-dom';
import './Products.css'; // Importera din anpassade CSS-fil

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.from('products').select('*');
        if (error) throw error;

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

  if (loading) return <p className="loading-text">Laddar produkter...</p>;
  if (error) return <p className="error-text">{error}</p>;

  // Helper function to calculate price including tax
  const calculatePriceWithTax = (price: number, taxRate: number) => {
    // Convert tax rate percentage to decimal and calculate total price
    return (price * (1 + taxRate)).toFixed(2); // Round to two decimal places
  };

  return (
    <div className="container-fluid custom-container mt-5 p-4 border rounded bg-light shadow">
      <h1 className="mb-4 text-center display-4">Våra Praliner</h1> {/* Modernare rubrik */}
      {products.length === 0 ? (
        <p className="text-center">Inga produkter tillgängliga just nu.</p>
      ) : (
        <div className="row">
          {products.map((product) => (
            <div key={product.id} className="col-lg-4 col-md-6 mb-4">
              <div className="card h-100 product-card shadow-sm">
                <Link to={`/product/${product.id}`} className="text-decoration-none text-dark">
                  <img
                    src={product.image_url || 'https://via.placeholder.com/300x300'}
                    alt={product.name}
                    className="card-img-top product-image"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/300x300';
                    }}
                  />
                  <div className="card-body">
                    <h2 className="card-title h5">{product.name}</h2>
                    <p className="card-text product-description">{product.description}</p>
                    <p className="card-text price-text">
                      <strong>{calculatePriceWithTax(product.price, product.tax / 1)} SEK</strong>
                    </p>
                    <p className="card-text">
                      <span className={`badge ${product.stock > 0 ? 'bg-success' : 'bg-danger'}`}>
                        {product.stock > 0 ? 'I lager' : 'Slut i lager'}
                      </span>
                    </p>
                  </div>
                </Link>
                <div className="card-footer text-center">
                  <button
                    className="btn btn-primary w-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (product.stock > 0) {
                        addToCart(product, 1);
                        alert(`${product.name} har lagts till i kundvagnen.`);
                      } else {
                        alert('Produkten är slut i lager.');
                      }
                    }}
                  >
                    Lägg till i kundvagn
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}













