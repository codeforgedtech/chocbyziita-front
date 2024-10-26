import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useCart } from '../contexts/CartContext';
import { Product } from '../types';
import './AllProducts.css'; // Importera den nya CSS-filen
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

export default function AllProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 6; 
  const { addToCart, cartItems } = useCart(); 

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(products.length / productsPerPage);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.from('products').select('*');
        if (error) throw error;

        setQuantities(
          (data as Product[]).reduce((acc: { [key: number]: number }, product: Product) => {
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
  }, [currentPage]);

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
    <div className="custom-allproducts-container">
      <h2 className="custom-allproducts-title">Alla produkter</h2>

      <div className="custom-allproducts-grid">
        {currentProducts.map((product) => {
          const isOutOfStock = product.stock <= 0;
          const isAddToCartDisabled = getCartItemQuantity(product.id) >= product.stock;

          return (
            <div key={product.id} className="custom-allproducts-card">
              <Link to={`/product/${product.id}`} className="text-decoration-none">
                <img
                  src={product.image_url && product.image_url.length > 0 ? product.image_url[0] : 'https://via.placeholder.com/150x150'}
                  alt={product.name}
                  className="custom-allproducts-card-img-top"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/150x150';
                  }}
                />
              </Link>

              <div className="custom-allproducts-card-body">
                <h5 className="custom-allproducts-card-title">{product.name}</h5>
                <p className="custom-allproducts-price">Pris: {calculatePriceWithTax(product.price, product.tax)} kr</p>
                <p className="custom-allproducts-stock">I lager: <strong>{product.stock}</strong></p>
              </div>

              <div className="custom-allproducts-card-footer">
                <button
                  className="custom-allproducts-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isOutOfStock) {
                      addToCart(product, quantities[product.id]);
                    }
                  }}
                  disabled={isOutOfStock || isAddToCartDisabled}
                >
                  {isOutOfStock ? 'Slut i lager' : 'Köp'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="d-flex justify-content-center mt-4">
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index}
            className={`btn ${currentPage === index + 1 ? 'btn-primary' : 'btn-secondary'} mx-1`}
            onClick={() => setCurrentPage(index + 1)}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}













