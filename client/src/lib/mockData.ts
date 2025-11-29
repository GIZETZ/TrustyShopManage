export interface Order {
  id: string;
  customer: string;
  items: string[];
  totalAmount: number;
  paidAmount: number;
  date: string;
  status: 'paid' | 'partial' | 'pending';
  note?: string;
}

export const mockOrders: Order[] = [
  {
    id: "ORD-001",
    customer: "Stephane Papa",
    items: ["Figure 37", "Figure 44"],
    totalAmount: 9000,
    paidAmount: 0,
    date: "2025-02-20",
    status: "pending",
    note: "Attente paiement"
  },
  {
    id: "ORD-002",
    customer: "Yoa Ble",
    items: ["Figure 42"],
    totalAmount: 10000,
    paidAmount: 0,
    date: "2025-02-21",
    status: "pending"
  },
  {
    id: "ORD-003",
    customer: "Stephane Papa",
    items: ["Figure 43", "Figure 40"],
    totalAmount: 20000,
    paidAmount: 8000,
    date: "2025-02-22",
    status: "partial"
  },
  {
    id: "ORD-004",
    customer: "Sosthene",
    items: ["Figure 42", "Figure 42"],
    totalAmount: 40000,
    paidAmount: 0,
    date: "2025-02-23",
    status: "pending"
  },
  {
    id: "ORD-005",
    customer: "Tychic",
    items: ["Figure 44", "Figure 42"],
    totalAmount: 8000,
    paidAmount: 0,
    date: "2025-02-24",
    status: "pending"
  },
  {
    id: "ORD-006",
    customer: "Zana",
    items: ["Marchandise diverse"],
    totalAmount: 20000,
    paidAmount: 0,
    date: "2025-02-25",
    status: "pending"
  },
  {
    id: "ORD-007",
    customer: "Julie",
    items: ["Les Sacs +"],
    totalAmount: 16500,
    paidAmount: 0,
    date: "2025-02-25",
    status: "pending"
  },
  {
    id: "ORD-008",
    customer: "Camara Souleymane",
    items: ["Marchandise diverse"],
    totalAmount: 5500,
    paidAmount: 3500,
    date: "2025-02-26",
    status: "partial"
  },
  {
    id: "ORD-009",
    customer: "Client 3e",
    items: ["1 pull noir", "1 pull rouge (M, XXL)"],
    totalAmount: 20000, // Inferring total from due + paid (13000+7000)
    paidAmount: 7000,
    date: "2025-02-26",
    status: "partial"
  },
  {
    id: "ORD-010",
    customer: "Client 4e",
    items: ["1 pull noir", "1 pull bleu (XXL)"],
    totalAmount: 11000, // 7000 + 4000
    paidAmount: 4000,
    date: "2025-02-27",
    status: "partial"
  },
  {
    id: "ORD-011",
    customer: "Client 5e",
    items: ["1 pull noir", "1 pull gris (XXL)"],
    totalAmount: 11000,
    paidAmount: 4000,
    date: "2025-02-27",
    status: "partial"
  },
  {
    id: "ORD-012",
    customer: "Client 7e",
    items: ["1 pull à capuche blanc (XL)"],
    totalAmount: 7000,
    paidAmount: 7000,
    date: "2025-02-27",
    status: "paid"
  },
  {
    id: "ORD-013",
    customer: "Client 9e",
    items: ["1 sac à main beige"],
    totalAmount: 5500, // 3500 + 2000
    paidAmount: 2000,
    date: "2025-02-28",
    status: "partial"
  },
  {
    id: "ORD-014",
    customer: "Client 12e",
    items: ["1 paire d'Asics (43)"],
    totalAmount: 22000, // 15000 + 7000
    paidAmount: 7000,
    date: "2025-02-28",
    status: "partial"
  },
  {
    id: "ORD-015",
    customer: "Client 13e",
    items: ["1 porte clé Tom et Jerry", "1 sac à main", "2 totes bags noirs"],
    totalAmount: 8000, // 4500 + 3500
    paidAmount: 3500,
    date: "2025-02-28",
    status: "partial"
  },
  {
    id: "ORD-016",
    customer: "K. Emmanuel Trustyshop",
    items: ["Marchandise diverse"],
    totalAmount: 5000,
    paidAmount: 0,
    date: "2025-02-28",
    status: "pending",
    note: "0747831404"
  },
  {
    id: "ORD-017",
    customer: "Amis Claude Stephane",
    items: ["Figure 44", "Figure XXL Pointure 45"],
    totalAmount: 25000, // 21000 + 4000 combined entry roughly
    paidAmount: 0,
    date: "2025-02-28",
    status: "pending"
  },
  {
    id: "ORD-018",
    customer: "Diambra",
    items: ["Figure 40", "Figure 44"],
    totalAmount: 39000,
    paidAmount: 10000,
    date: "2025-02-28",
    status: "partial"
  }
];
