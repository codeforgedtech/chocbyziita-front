import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Product } from '../types';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity: number) => void; 
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;  // Add clearCart to the type
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = (product: Product, quantity: number) => {
    if (!product.id) {
      console.error("Cannot add product without an ID:", product);
      return;
    }

    setCartItems((prevItems) => {
      const existingItem = prevItems.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevItems, { product, quantity }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCartItems((prevItems) => prevItems.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity < 1) return; // Prevent setting quantity to less than 1
    setCartItems((prevItems) => {
      return prevItems.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      );
    });
  };

  const clearCart = () => {
    setCartItems([]); // Clear the cart items
  };

  // Calculate total price
  const totalPrice = cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};








