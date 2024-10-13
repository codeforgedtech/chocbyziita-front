import React, { useState } from 'react';
import { supabase } from '../../supabaseClient'; // Import your Supabase client

interface Product {
  name: string;
  price: number;
  stock: number;
  ingredients: string[];
  description: string;
  tax: number; // Tax as a number
}

interface FormData {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  shippingMethod: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  phoneNumber: string;
  tax: string; // Keep this as a string for form management
}

const AddProduct: React.FC = () => {
  const [product, setProduct] = useState<Product>({
    name: '',
    price: 0,
    stock: 0,
    ingredients: [],
    description: '',
    tax: 0, // Initialize tax
  });

  const [image, setImage] = useState<File | null>(null);
  const [ingredient, setIngredient] = useState<string>(''); // State for the new ingredient
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 200 * 1024) { // 200 KB
        setError('Bildstorleken får inte överstiga 200 KB.');
        setImage(null);
      } else {
        setError(null);
        setImage(file);
      }
    }
  };

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    shippingMethod: 'standard',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    phoneNumber: '',
    tax: '25', // Default tax value as a string
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'tax') {
      const taxValue = parseFloat(value) / 100; // Convert percentage to decimal
      setProduct((prev) => ({ ...prev, tax: taxValue }));
      setFormData((prev) => ({ ...prev, [name]: value })); // Keep the string value for form state
    } else {
      setProduct((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleIngredientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIngredient(e.target.value);
  };

  const addIngredient = () => {
    if (ingredient.trim() === '') {
      setError('Ingrediensen kan inte vara tom.');
      return;
    }

    setProduct((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, ingredient.trim()],
    }));
    setIngredient(''); // Reset ingredient input
    setError(null);
  };

  const removeIngredient = (index: number) => {
    setProduct((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Validate form fields
    if (!product.name || !product.price || !product.stock || product.ingredients.length === 0 || !product.description || !product.tax || !image) {
      setError('Var vänlig fyll i alla fält.');
      return;
    }

    setError(null);
    setSuccess(null);

    // Upload the image to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('products')
      .upload(`public/${image.name}`, image, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      setError(`Fel vid uppladdning av bild: ${uploadError.message}`);
      return;
    }

    // Get download URL for the image
    const { data } = supabase.storage
      .from('products')
      .getPublicUrl(`public/${image.name}`);

    const publicURL = data?.publicUrl;

    if (!publicURL) {
      setError('Fel vid hämtning av bild-URL: Ingen giltig URL tillgänglig.');
      return;
    }

    const { error: productError } = await supabase
      .from('products')
      .insert({
        name: product.name,
        price: product.price,
        stock: product.stock,
        ingredients: product.ingredients, // Ensure this is an array
        description: product.description,
        tax: product.tax, // Add tax here
        image_url: publicURL, // Save the image in the product
      });

    if (productError) {
      setError(`Fel vid skapande av produkt: ${productError.message}`);
      return;
    }

    // Reset the form
    setProduct({
      name: '',
      price: 0,
      stock: 0,
      ingredients: [],
      description: '',
      tax: 0,
    });
    setImage(null);
    setSuccess('Produkten har skapats framgångsrikt!');
  };

  return (
    <div className="container mt-5">
      <h2>Lägg till Produkt</h2>
      <form onSubmit={handleSubmit}>
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        
        <div className="mb-3">
          <label htmlFor="name" className="form-label">Produktnamn</label>
          <input
            type="text"
            className="form-control"
            id="name"
            name="name"
            value={product.name}
            onChange={handleChange}
            placeholder="Ange produktnamn"
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="price" className="form-label">Pris (SEK)</label>
          <input
            type="number"
            className="form-control"
            id="price"
            name="price"
            value={product.price}
            onChange={handleChange}
            placeholder="Ange pris i SEK"
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="stock" className="form-label">Lager</label>
          <input
            type="number"
            className="form-control"
            id="stock"
            name="stock"
            value={product.stock}
            onChange={handleChange}
            placeholder="Ange lagermängd"
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="ingredients" className="form-label">Ingredienser</label>
          <div className="d-flex mb-2">
            <input
              type="text"
              className="form-control me-2"
              id="ingredient"
              value={ingredient}
              onChange={handleIngredientChange}
              placeholder="Lägg till ingrediens"
            />
            <button type="button" className="btn btn-outline-primary" onClick={addIngredient}>Lägg till</button>
          </div>
          <ul className="list-group">
            {product.ingredients.map((ingredient, index) => (
              <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                {ingredient}
                <button type="button" className="btn btn-danger btn-sm" onClick={() => removeIngredient(index)}>Ta bort</button>
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-3">
          <label htmlFor="description" className="form-label">Beskrivning</label>
          <textarea
            className="form-control"
            id="description"
            name="description"
            value={product.description}
            onChange={handleChange}
            placeholder="Skriv en kort produktbeskrivning"
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="tax" className="form-label">Moms (%)</label>
          <p className="small text-muted">Vänligen välj moms som ska tillämpas på produkten. (Exempel: för 25% moms, välj 25)</p>
          <div>
            <div className="form-check">
              <input
                type="radio"
                name="tax"
                value="25"
                checked={formData.tax === '25'}
                onChange={handleChange}
                className="form-check-input"
                id="tax-25"
                required
              />
              <label className="form-check-label" htmlFor="tax-25">25% (Standard)</label>
            </div>
            <div className="form-check">
              <input
                type="radio"
                name="tax"
                value="12"
                checked={formData.tax === '12'}
                onChange={handleChange}
                className="form-check-input"
                id="tax-12"
              />
              <label className="form-check-label" htmlFor="tax-12">12% (Livsmedel och hotell)</label>
            </div>
            <div className="form-check">
              <input
                type="radio"
                name="tax"
                value="6"
                checked={formData.tax === '6'}
                onChange={handleChange}
                className="form-check-input"
                id="tax-6"
              />
              <label className="form-check-label" htmlFor="tax-6">6% (Böcker och kultur)</label>
            </div>
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="image" className="form-label">Produktbild</label>
          <input
            type="file"
            className="form-control"
            id="image"
            accept="image/*"
            onChange={handleImageChange}
            required
          />
          <small className="form-text text-muted">Maximal filstorlek: 200 KB</small>
        </div>

        <button type="submit" className="btn btn-primary">Lägg till produkt</button>
      </form>
    </div>
  );
};

export default AddProduct;








