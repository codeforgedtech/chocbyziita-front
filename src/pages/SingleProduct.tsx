import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Product } from '../types';
import { useCart } from '../contexts/CartContext';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap
import './SingleProduct.css'; // Import custom CSS

export default function SingleProduct() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const { addToCart, cartItems } = useCart(); // Fetch cartItems from context

  // Define VAT percentage (25% in Sweden)
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

        if (error) {
          throw error;
        }

        setProduct(data as Product);
        setCurrentImage(data?.image_url[0] || ''); // Set first image as default current image
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

    addToCart(product, quantity); // Add product and quantity to cart
    alert(`${quantity} av ${product.name} har lagts till i kundvagnen!`);
  };

  const handleImageClick = (imageUrl: string) => {
    setCurrentImage(imageUrl);
  };

  if (loading) return <p>Laddar produkt...</p>;
  if (error) return <p>{error}</p>;
  if (!product) return <p>Ingen produkt hittades.</p>;

  // Calculate price including VAT
  const priceWithVAT = product.price * (1 + VAT_RATE);

  // Handle images
  const imageUrls = product.image_url.length > 0 ? product.image_url : [];
  const placeholderImage = 'https://via.placeholder.com/300';

  // Get current quantity in cart
  const currentCartQuantity = getCartItemQuantity(product.id);
  const isAddToCartDisabled = currentCartQuantity >= product.stock; // Disable if cart quantity meets or exceeds stock

  return (
    <div className="container custom-container mt-5 p-4 border rounded bg-light shadow">
      <div className="row">
        <div className="col-md-6 d-flex flex-column align-items-center">
          {/* Larger image */}
          <img
            src={currentImage || placeholderImage}
            alt={product.name}
            className="img-fluid rounded shadow-sm single-product-image mb-3"
            style={{ maxHeight: '500px', objectFit: 'cover' }} // Ensure images fit within the area
          />

          {/* Thumbnails */}
          <div className="row g-2 justify-content-center">
            {imageUrls.slice(0, 4).map((imageUrl, index) => (
              <div className="col-3" key={index}>
                <img
                  src={imageUrl || placeholderImage}
                  alt={`${product.name} bild ${index + 1}`}
                  className={`img-fluid rounded shadow-sm smaller-image ${currentImage === imageUrl ? 'border border-primary' : ''}`}
                  onClick={() => handleImageClick(imageUrl)}
                  style={{ cursor: 'pointer', maxHeight: '100px', objectFit: 'cover' }} // Thumbnail styling
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = placeholderImage;
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="col-md-6">
          <h1 className="product-title mb-3">{product.name}</h1>
         
          <p className="price h3 text-primary">{priceWithVAT.toFixed(2)} SEK inkl. moms</p>
          <p className="stock-status">
            Lager: <span className={`badge ${product.stock > 0 ? 'bg-success' : 'bg-danger'}`}>
              {product.stock > 0 ? `${product.stock} kvar` : 'Slut i lager'}
            </span>
          </p>
          <p className="sku"><strong>SKU:</strong> {product.sku || 'Ingen SKU tillgänglig'}</p>
          <p className="ingredients"><strong>Ingredienser:</strong> {product.ingredients.join(', ')}</p>
          <p className="categories"><strong>Kategorier:</strong> {product.categories.join(', ')}</p>

          {/* Additional Product Information */}
          <div className="additional-info">
            <h5>Mer information:</h5>
            <p dangerouslySetInnerHTML={{ __html: product.description || 'Ingen ytterligare information tillgänglig.' }} />
          </div>

          <div className="quantity-selector mb-4">
            <label htmlFor="quantity" className="form-label">Antal:</label>
            <div className="input-group">
              <input
                id="quantity"
                type="number"
                className="form-control"
                value={quantity}
                onChange={(e) => {
                  const value = Math.max(1, Math.min(Number(e.target.value), product.stock - currentCartQuantity));
                  setQuantity(value);
                }}
                min="1"
                max={product.stock - currentCartQuantity} // Ensure quantity does not exceed stock
              />
            </div>
          </div>
          
          <button 
            className="btn btn-primary w-100 btn-lg mb-3" 
            onClick={handleAddToCart} 
            disabled={product.stock === 0 || isAddToCartDisabled} // Disable if out of stock or max quantity in cart
          >
            {product.stock > 0 ? (isAddToCartDisabled ? 'Max antal i varukorg' : 'Lägg till i kundvagn') : 'Slut i lager'}
          </button>
        </div>
      </div>
    </div>
  );
}









