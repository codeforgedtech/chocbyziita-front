import React from 'react';
import ImageSlider from '../moduler/Slider';
import Products from './Products';

import ContactUs from '../moduler/ContactUs';

const Home: React.FC = () => {
  return (
    <div>
      {/* Slider */}
      <ImageSlider />
      
      {/* Utvalda produkter */}
      <section className="featured-products">
    
        <Products />
        <ContactUs />
      </section>
    </div>
  );
};

export default Home;
