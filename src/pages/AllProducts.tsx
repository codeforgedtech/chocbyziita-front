import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useCart } from '../contexts/CartContext';
import { Product } from '../types';
import './AllProducts.css'; 
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { Modal, Button } from 'react-bootstrap'; // Importera Modal och Button
import ContactUs from '../moduler/ContactUs';
import ImageSlider from '../moduler/AllSlider';

export default function AllProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 4; 
  const { addToCart, cartItems } = useCart();
  
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(0);

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;

  const totalPages = Math.ceil(products.length / productsPerPage);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.from('products').select('*');
        if (error) throw error;

        setQuantities(
          (data as Product[]).reduce((acc: { [key: number]: number }, product: Product) => {
            acc[product.id] = 1; // Sätta standardkvantitet till 1 för varje produkt
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

  const sortedProducts = [...products].sort((a, b) => {
    if (sortOrder === 'asc') {
      return a.price - b.price; // Sortera i stigande ordning
    } else {
      return b.price - a.price; // Sortera i fallande ordning
    }
  });

  const handleAddToCart = (product: Product) => {
    const isOutOfStock = product.stock <= 0;
    const isAddToCartDisabled = getCartItemQuantity(product.id) >= product.stock;

    if (!isOutOfStock && !isAddToCartDisabled) {
      addToCart(product, quantities[product.id]);
      setModalProduct(product); // Sätta den aktuella produkten för modalen
      setQuantity(quantities[product.id]); // Sätta kvantitet
      setShowModal(true); // Öppna modalen
    }
  };

  if (loading) return <p className="loading-text text-center">Laddar produkter...</p>;
  if (error) return <p className="error-text text-center">{error}</p>;

  return (
    <>
          <ImageSlider />
    <div className="custom-allproducts-container">
      <h2 className="custom-allproducts-title">Alla produkter</h2>

      {/* Sorteringsalternativ */}
      <div className="mb-3">
        <label htmlFor="sortOrder" className="form-label">Sortera efter pris:</label>
        <select
          id="sortOrder"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
          className="form-select"
        >
          <option value="asc">Stigande</option>
          <option value="desc">Fallande</option>
        </select>
      </div>

      <div className="custom-allproducts-grid">
        {sortedProducts.slice(indexOfFirstProduct, indexOfLastProduct).map((product) => {
          const isOutOfStock = product.stock <= 0;
          const isAddToCartDisabled = getCartItemQuantity(product.id) >= product.stock;

          return (
            <div key={product.id} className="custom-allproducts-card">
              <Link to={`/product/${product.id}`} className="text-decoration-none" onClick={(e) => e.preventDefault()}>
                <img
                  src={product.image_url && product.image_url.length > 0 ? product.image_url[0] : 'https://via.placeholder.com/150x150'}
                  alt={product.name}
                  className="custom-allproducts-card-img-top"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/150x150';
                  } } />
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
                    handleAddToCart(product); // Använd handleAddToCart istället
                  } }
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
            className={`custom-btn ${currentPage === index + 1 ? 'custom-btn-primary' : 'custom-btn-secondary'} mx-1`}
            onClick={() => setCurrentPage(index + 1)}
          >
            {index + 1}
          </button>
        ))}

      </div>


      {/* Modal för bekräftelse */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Produkt tillagd</Modal.Title>
        </Modal.Header>
        <Modal.Body>{quantity} av {modalProduct?.name} har lagts till i kundvagnen!</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Stäng
          </Button>
        </Modal.Footer>
      </Modal>
    </div><ContactUs /></>
  );
}















