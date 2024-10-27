import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Product } from '../types';
import { useCart } from '../contexts/CartContext';
import { Modal, Button } from 'react-bootstrap'; // Importera modal
import 'bootstrap/dist/css/bootstrap.min.css';
import './SingleProduct.css';

export default function SingleProduct() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const { addToCart, cartItems } = useCart();
  const [showModal, setShowModal] = useState(false); // State för modal

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        setProduct(data as Product);
        setCurrentImage(data?.image_url[0] || '');
      } catch (error) {
        console.error('Error fetching product:', error);
        setError('Kunde inte hämta produktinformation');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const getCartItemQuantity = (productId: number) => {
    const cartItem = cartItems.find(item => item.product.id === productId);
    return cartItem ? cartItem.quantity : 0;
  };

  const handleAddToCart = () => {
    if (!product) return;
    const currentCartQuantity = getCartItemQuantity(product.id);
    if (currentCartQuantity + quantity > product.stock) {
      alert('Du kan inte lägga till fler än vad som finns i lager.');
      return;
    }

    addToCart(product, quantity);
    setShowModal(true); // Visa modalen
  };

  const handleImageClick = (imageUrl: string) => {
    setCurrentImage(imageUrl);
  };

  if (loading) return <p>Laddar produkt...</p>;
  if (error) return <p>{error}</p>;
  if (!product) return <p>Ingen produkt hittades.</p>;

  // Calculate the price with tax
  const priceWithTax = product.tax ? product.price * (1 + product.tax) : product.price; // Use the tax from the database
  const imageUrls = product.image_url.length > 0 ? product.image_url : [];
  const placeholderImage = 'https://via.placeholder.com/300';
  const currentCartQuantity = getCartItemQuantity(product.id);
  const isAddToCartDisabled = currentCartQuantity >= product.stock;

  return (
    <div className="single-container">
      <div className="row">
        <div className="col-md-5">
          <img
            src={currentImage || placeholderImage}
            alt={product.name}
            className="img-fluid single-product-image mb-4 rounded shadow-sm"
          />
          <div className="single-thumbnail-container">
            {imageUrls.slice(0, 4).map((imageUrl, index) => (
              <img
                key={index}
                src={imageUrl || placeholderImage}
                alt={`image ${index}`}
                className="img-fluid single-smaller-image rounded"
                onClick={() => handleImageClick(imageUrl)}
              />
            ))}
          </div>
        </div>

        <div className="col-md-6">
          <h1 className="single-product-title">{product.name}</h1>
          <p className="single-description" dangerouslySetInnerHTML={{ __html: product.description }} />
          <p className="single-ingredients"><strong>Ingredienser:</strong> {product.ingredients.join(', ')}</p>
          <p className="single-categories"><strong>Kategorier:</strong> {product.categories.join(', ')}</p>
          <p className="single-stock-status">
            Lager status: <span className={`status-dot ${product.stock > 0 ? 'bg-success' : 'bg-danger'}`}></span>
          </p>

          <div className="single-quantity-selector mb-3 d-flex align-items-center">
            <p className="single-price">{priceWithTax.toFixed(2)} kr</p>
            <div className="input-group input-group-sm w-50 single-div">
              <button 
                className="btn btn-outline-secondary" 
                onClick={() => setQuantity(prev => Math.max(1, prev - 1))} 
                disabled={quantity <= 1}
              >
                <i className="fas fa-minus"></i>
              </button>

              <input
                type="number"
                className="form-control text-center"
                id="quantity"
                value={quantity}
                min="1"
                max={product.stock - currentCartQuantity}
                readOnly
              />
              <button 
                className="btn btn-outline-secondary" 
                onClick={() => setQuantity(prev => Math.min(product.stock - currentCartQuantity, prev + 1))} 
                disabled={product.stock - currentCartQuantity <= quantity}
              >
                <i className="fas fa-plus"></i>
              </button>
            </div>
          </div>

          <button 
            className="single-cart-button"
            onClick={handleAddToCart}
            disabled={product.stock === 0 || isAddToCartDisabled}
          >
            {product.stock > 0 ? (isAddToCartDisabled ? 'Max antal ' : 'Lägg i kundvagn') : 'Slut i lager'}
          </button>
        </div>
      </div>

      {/* Modal för att visa meddelande om att produkten har lagts till */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Produkt tillagd</Modal.Title>
        </Modal.Header>
        <Modal.Body>{quantity} av {product.name} har lagts till i kundvagnen!</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Stäng
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

















