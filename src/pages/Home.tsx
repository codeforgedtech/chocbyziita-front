import React from 'react';
import ImageSlider from '../components/Slider';
import Products from './Products';

const Home: React.FC = () => {
  return (
    <div>
      {/* Slider */}
      <ImageSlider />
      
      {/* Utvalda produkter */}
      <section className="featured-products">
    
        <Products />
      </section>
    </div>
  );
};

export default Home;
