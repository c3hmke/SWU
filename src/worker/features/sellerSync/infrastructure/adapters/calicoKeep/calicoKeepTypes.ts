export type StorepassListResponse = StorepassTermResult[];

export type StorepassTermResult = {
  term: string;
  quantity: number;
  products?: StorepassProduct[];
};

export type StorepassProduct = {
  name: string;
  price: number;
  url: string;
  image_url?: string;
  product_id: number;
  variantInfo?: StorepassVariant[];
};

export type StorepassVariant = {
  id: number;
  title: string;
  price: number;
  inventory_quantity: number;
  price_text?: string;
};
