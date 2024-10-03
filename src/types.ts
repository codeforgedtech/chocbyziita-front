export interface Product {

  stock: number;
  ingredients: any;
  id: number;
  name: string;
  description: string;
  price: number;
  tax: number; 
  image_url: string | null; // Definiera image_url som string eller null
}