export interface StockItem {
  id: string;
  colorCode: string;    // e.g. "9111", "CUST-001"
  colorName: string;    // e.g. "カーボングレー"
  colorHex: string;     // e.g. "#484848"
  isCustom: boolean;
  category: string;     // "外壁・屋根用" | "屋根専用" | "カスタム"
  stock: number;
  unit: string;         // "缶" | "kg" | "L" | "セット"
  minStock: number;
  note: string;
  addedAt: string;      // ISO datetime
  updatedAt: string;    // ISO datetime
}

export interface StockTransaction {
  id: string;
  itemId: string;
  colorCode: string;
  colorName: string;
  type: 'in' | 'out';
  amount: number;
  unit: string;
  reason: string;
  date: string;         // YYYY-MM-DD
  createdAt: string;    // ISO datetime
}

export interface InventoryData {
  items: StockItem[];
  transactions: StockTransaction[];
}
