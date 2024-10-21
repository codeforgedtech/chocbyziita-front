export interface Product {
  tax_rate: number;
  sku: string;
  categories: string[];

  stock: number;
  ingredients: string[];
  id: number;
  name: string;
  description: string;
  price: number;
  tax: number; 
  image_url: string[]; // Definiera image_url som string eller null
}