// Type definitions
export interface BaseItem {
  PK: string;
  SK: string;
  Type: string;
  Data: any;
  GSI1PK?: string;
  GSI1SK?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface User {
  userId: string;
  name: string;
  email: string;
  userType: 'customer' | 'seller';
}

export interface Product {
  productId: string;
  name: string;
  price: number;
  description: string;
  sellerId: string;
}

export interface Order {
  orderId: string;
  customerId: string;
  total: number;
  status: string;
  orderDate: string;
}

export interface OrderItem {
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Review {
  reviewId: string;
  customerId: string;
  productId: string;
  rating: number;
  comment: string;
  reviewDate: string;
}

export interface Category {
  categoryId: string;
  name: string;
  description: string;
}

// Helper types for query results
export interface ProductWithRelationships {
  product: Product;
  reviews: Review[];
  categories: Category[];
}

export interface OrderWithItems {
  order: Order;
  items: OrderItem[];
}
