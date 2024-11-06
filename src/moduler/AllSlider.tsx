import React from 'react';
import Slider from 'react-slick';
import slideParlin from "../assets/hero.png";

// Importera slick-carousel CSS-filer
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './Slider.css'; // Importera CSS

const ImageSlider: React.FC = () => {
  const settings = {
    dots: true, // Visa punkter för navigation
    infinite: true, // Oändlig rullning
    speed: 1000, // Hastighet av övergång
    slidesToShow: 1, // Antal slides som ska visas
    slidesToScroll: 1, // Antal slides som ska rullas vid varje klick
    autoplay: true, // Automatisk rullning
    autoplaySpeed: 5000, // Hastighet för automatisk rullning (3 sekunder)
  };

  return (
    <div className="slider-container"> {/* Lägg till CSS-klassen här */}
      <Slider {...settings}>
        <div>
          <img src={slideParlin} alt="Slide 1" />

        </div>
        
      </Slider>
    </div>
  );
};

export default ImageSlider;

