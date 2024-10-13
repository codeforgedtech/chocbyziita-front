import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Product } from '../types';
import { useCart } from '../contexts/CartContext';
import 'bootstrap/dist/css/bootstrap.min.css'; // Importera Bootstrap
import './SingleProduct.css'; // Importera anpassad CSS

export default function SingleProduct() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

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
      } catch (error) {
        console.error('Error fetching product:', error);
        setError('Kunde inte hämta produktinformation');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;

    if (quantity > product.stock) {
      alert('Du kan inte lägga till fler än vad som finns i lager.');
      return;
    }

    addToCart(product, quantity);
    alert(`${quantity} av ${product.name} har lagts till i kundvagnen!`);
  };

  if (loading) return <p>Laddar produkt...</p>;
  if (error) return <p>{error}</p>;
  if (!product) return <p>Ingen produkt hittades.</p>;

  return (
    <div className="container-fluid custom-container mt-5 p-4 border rounded bg-light shadow">
      <div className="row">
        <div className="col-md-6 d-flex justify-content-center">
          <img 
            src={product.image_url || 'https://via.placeholder.com/300'} 
            alt={product.name} 
            className="img-fluid rounded shadow-sm single-product-image" // Anpassad bildklass
          />
        </div>
        <div className="col-md-6">
          <h1 className="product-title mb-3">{product.name}</h1>
          <p className="product-description text-muted">{product.description}</p>
          <p className="price h3 text-primary">{product.price} SEK</p> {/* Pris i framträdande färg */}
          <p className="stock-status">
            Lager: <span className={`badge ${product.stock > 0 ? 'bg-success' : 'bg-danger'}`}>
              {product.stock > 0 ? `${product.stock} kvar` : 'Slut i lager'}
            </span>
          </p>
          <p className="ingredients"><strong>Ingredienser:</strong> {product.ingredients.join(', ')}</p>
          
          <div className="quantity-selector mb-4">
            <label htmlFor="quantity" className="form-label">Antal:</label>
            <div className="input-group">
              <input
                id="quantity"
                type="number"
                className="form-control"
                value={quantity}
                onChange={(e) => {
                  const value = Math.max(1, Math.min(Number(e.target.value), product.stock));
                  setQuantity(value);
                }}
                min="1"
                max={product.stock}
              />
            </div>
          </div>
          
          <button 
            className="btn btn-primary w-100 btn-lg mb-3" 
            onClick={handleAddToCart} 
            disabled={product.stock === 0}
          >
            {product.stock > 0 ? 'Lägg till i kundvagn' : 'Slut i lager'}
          </button>
        </div>
      </div>
    </div>
  );
}




