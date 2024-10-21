import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Product } from '../types';
import { useCart } from '../contexts/CartContext';
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

  const VAT_RATE = 0.25;

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
    alert(`${quantity} av ${product.name} har lagts till i kundvagnen!`);
  };

  const handleImageClick = (imageUrl: string) => {
    setCurrentImage(imageUrl);
  };

  if (loading) return <p>Laddar produkt...</p>;
  if (error) return <p>{error}</p>;
  if (!product) return <p>Ingen produkt hittades.</p>;

  const priceWithVAT = product.price * (1 + VAT_RATE);
  const imageUrls = product.image_url.length > 0 ? product.image_url : [];
  const placeholderImage = 'https://via.placeholder.com/300';
  const currentCartQuantity = getCartItemQuantity(product.id);
  const isAddToCartDisabled = currentCartQuantity >= product.stock;

  return (
    <div className="container custom-container">
      <div className="row">
        <div className="col-md-6">
          <img
            src={currentImage || placeholderImage}
            alt={product.name}
            className="img-fluid single-product-image mb-4 rounded shadow-sm"
          />

          <div className="row g-2">
            {imageUrls.slice(0, 4).map((imageUrl, index) => (
              <div className="col-3" key={index}>
                <img
                  src={imageUrl || placeholderImage}
                  alt={`image ${index}`}
                  className="img-fluid smaller-image rounded"
                  onClick={() => handleImageClick(imageUrl)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="col-md-6">
          <h1 className="product-title">{product.name}</h1>
          <p className="description" dangerouslySetInnerHTML={{ __html: product.description }} />
          <p className="ingredients"><strong>Ingredienser:</strong> {product.ingredients.join(', ')}</p>
          <p className="categories"><strong>Kategorier:</strong> {product.categories.join(', ')}</p>
          <p className="stock-status">
            Lager status: <span className={`status-dot ${product.stock > 0 ? 'bg-success' : 'bg-danger'}`}></span>
          </p>
      
          <div className="quantity-selector mb-3 d-flex align-items-center">
          <p className="price">{priceWithVAT.toFixed(2)} kr</p>
            <div className="input-group input-group-sm w-50 custom-div">
            <button 
                className="bbtn btn-outline-secondar" 
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
              className="custom-cart-singel"
              onClick={handleAddToCart}
              disabled={product.stock === 0 || isAddToCartDisabled}
          >
              {product.stock > 0 ? (isAddToCartDisabled ? 'Max antal ' : 'Lägg i kundvagn') : 'Slut i lager'}
          </button>
        </div>
      </div>
    </div>
  );
}












