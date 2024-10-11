declare module 'react-slick' {
    import { Component } from 'react';
  
    interface Settings {
      dots?: boolean;
      infinite?: boolean;
      speed?: number;
      slidesToShow?: number;
      slidesToScroll?: number;
      autoplay?: boolean;
      // Lägg till andra inställningar som du behöver
    }
  
    export default class Slider extends Component<Settings> {}
  }
  