export interface Order {
  id: string;
  customer: string;
  items: string[];
  totalAmount: number;
  paidAmount: number;
  status: 'paid' | 'partial' | 'pending';
  note?: string;
  images?: string[];
  createdAt: string;
}

export interface CreateOrderData {
  customer: string;
  items: string[];
  totalAmount: number;
  paidAmount: number;
  status: 'paid' | 'partial' | 'pending';
  note?: string;
  images?: string[];
}

export async function fetchOrders(): Promise<Order[]> {
  const response = await fetch('/api/orders');
  if (!response.ok) {
    throw new Error('Failed to fetch orders');
  }
  return response.json();
}

export async function createOrder(data: CreateOrderData): Promise<Order> {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create order');
  }
  return response.json();
}

export async function updateOrder(id: string, data: Partial<CreateOrderData>): Promise<Order> {
  const response = await fetch(`/api/orders/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update order');
  }
  return response.json();
}

export async function deleteOrder(id: string): Promise<void> {
  const response = await fetch(`/api/orders/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete order');
  }
}
