import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useCart } from '../contexts/CartContext';
import { Product } from '../types';
import './AllProducts.css'; 
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

export default function AllProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState<string | null>(null);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isIngredientOpen, setIsIngredientOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1); 
  const productsPerPage = 12; 
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
  const { addToCart, cartItems } = useCart(); 

  const toggleCategoryDropdown = () => {
    setIsCategoryOpen(!isCategoryOpen);
  };

  const toggleIngredientDropdown = () => {
    setIsIngredientOpen(!isIngredientOpen);
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase.from('products').select('categories');
        if (error) throw error;

        const categorySet = new Set<string>();
        data.forEach((product: { categories: string[] }) => {
          product.categories.forEach((category: string) => categorySet.add(category));
        });

        setCategories(Array.from(categorySet));
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const { data, error } = await supabase.from('products').select('ingredients');
        if (error) throw error;

        const ingredientSet = new Set<string>();
        data.forEach((product: { ingredients: string[] }) => {
          product.ingredients.forEach((ingredient: string) => ingredientSet.add(ingredient));
        });

        setIngredients(Array.from(ingredientSet));
      } catch (error) {
        console.error('Error fetching ingredients:', error);
      }
    };

    fetchIngredients();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        let query = supabase.from('products').select('*');

        if (selectedCategory) {
          query = query.contains('categories', [selectedCategory]);
        }

        if (selectedIngredient) {
          query = query.contains('ingredients', [selectedIngredient]);
        }

        const start = (currentPage - 1) * productsPerPage;
        const end = start + productsPerPage - 1;
        query = query.range(start, end); 

        const { data, error } = await query;
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
  }, [currentPage, selectedCategory, selectedIngredient]); 

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

  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
    setCurrentPage(1); 
    setIsCategoryOpen(false); 
  };

  const handleIngredientChange = (ingredient: string | null) => {
    setSelectedIngredient(ingredient);
    setCurrentPage(1); 
    setIsIngredientOpen(false); 
  };

  const totalPages = Math.ceil(products.length / productsPerPage); 

  if (loading) return <p className="loading-text text-center">Laddar produkter...</p>;
  if (error) return <p className="error-text text-center">{error}</p>;

  return (
    <div className="container mt-5 px-4 custom-container">
      <h2 className="text-center mb-6 custom-padding-top">Alla produkter</h2>

      {/* Filters Row */}
      <div className="row mb-4">
        <div className="col-md-4 d-flex justify-content-between">
          {/* Category Filter */}
          <div className="custom-dropdown">
            <div className="dropdown text-center">
              <button
                className="custom-cart dropdown-toggle w-100"
                type="button"
                id="categoryDropdown"
                data-bs-toggle="dropdown"
                aria-expanded={isCategoryOpen}
                onClick={toggleCategoryDropdown}
              >
                {selectedCategory ? selectedCategory : 'Alla Kategorier'}
              </button>
              
              <ul className={`dropdown-menu ${isCategoryOpen ? 'show' : ''}`} aria-labelledby="categoryDropdown">
                <li>
                  <button className="dropdown-item" onClick={() => handleCategoryChange(null)}>
                    Alla Kategorier
                  </button>
                </li>

                {categories.length > 0 ? (
                  categories.map((category, index) => (
                    <li key={index}>
                      <button
                        className="dropdown-item"
                        onClick={() => handleCategoryChange(category)}
                      >
                        {category}
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="dropdown-item">Inga kategorier tillgängliga</li>
                )}
              </ul>
            </div>
          </div>

          {/* Ingredient Filter */}
          <div className="custom-dropdown">
            <div className="dropdown text-center">
              <button
                className="custom-cart dropdown-toggle w-100"
                type="button"
                id="ingredientDropdown"
                data-bs-toggle="dropdown"
                aria-expanded={isIngredientOpen}
                onClick={toggleIngredientDropdown}
              >
                {selectedIngredient ? selectedIngredient : 'Alla Ingredienser'}
              </button>
              
              <ul className={`dropdown-menu ${isIngredientOpen ? 'show' : ''}`} aria-labelledby="ingredientDropdown">
                <li>
                  <button className="dropdown-item" onClick={() => handleIngredientChange(null)}>
                    Alla Ingredienser
                  </button>
                </li>

                {ingredients.length > 0 ? (
                  ingredients.map((ingredient, index) => (
                    <li key={index}>
                      <button
                        className="dropdown-item"
                        onClick={() => handleIngredientChange(ingredient)}
                      >
                        {ingredient}
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="dropdown-item">Inga ingredienser tillgängliga</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4"> {/* Ta bort row-cols klasser */}
  {currentProducts.map((product) => {  
    const currentCartQuantity = getCartItemQuantity(product.id);
    const isAddToCartDisabled = currentCartQuantity >= product.stock;
    const isOutOfStock = product.stock === 0;

    return (
      <div key={product.id} className="col-6 col-md-4 col-lg-3"> {/* Specifika kolumner */}
        <div className="card h-100 shadow-sm border-1">
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

          <div className="card-body text-center">
            <h5 className="card-title text-dark">{product.name}</h5>
            <p className="ingredients text-left"><strong>Ingredienser:</strong> {product.ingredients.join(', ')}</p>
            <p className="categories text-left"><strong>Kategorier:</strong> {product.categories.join(', ')}</p>
            <p className="stock-status text-left">
              Lager status: <span className={`status-dot ${product.stock > 0 ? 'bg-success' : 'bg-danger'}`}>  </span><span className='badge badge-secondary custom-padding'><strong>{product.stock} st</strong></span>
            </p>
          </div>

          <div className="card-footer d-flex justify-content-between align-items-center p-2">
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
                showToast(`${product.name} har lagts till i kundvagnen.`);
              } else {
                showToast('Produkten är slut i lager.');
              }
            }}
            disabled={isOutOfStock || isAddToCartDisabled}
          >
            Lägg i Varukorgen
          </button>
        </div>
      </div>
    );
  })}
</div>

      {/* Pagination */}
      <div className="d-flex justify-content-center align-items-center pagination-container">
  <button
    className="pagination-button"
    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
    disabled={currentPage === 1}
  >
    <FaAngleLeft />
  </button>
  
  <span className="pagination-text"> {currentPage} av {totalPages}</span>
  
  <button
    className="pagination-button"
    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
    disabled={currentPage === totalPages}
  >
  <FaAngleRight />
  </button>
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







