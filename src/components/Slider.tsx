import React from 'react';
import Slider from 'react-slick';
import slide1 from "../assets/slid1.png"
import slide2 from "../assets/slid2.png"
import slide3 from "../assets/slid3.png"
// Importera slick-carousel CSS-filer
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const ImageSlider: React.FC = () => {
  const settings = {
    dots: true, // Visa punkter för navigation
    infinite: true, // Oändlig rullning
    speed: 500, // Hastighet av övergång
    slidesToShow: 1, // Antal slides som ska visas
    slidesToScroll: 1, // Antal slides som ska rullas vid varje klick
  };

  return (
    <div>
 <Slider {...settings}>
        <div>
          <img src={slide1} alt="Slide 1" />
        </div>
        <div>
        <img src={slide2} alt="Slide 2" />
        </div>
        <div>
        <img src={slide3} alt="Slide 3" />
        </div>
      </Slider>
    </div>
  );
};

export default ImageSlider;

