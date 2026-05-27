/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Global User Roles
export type UserRole = "Admin" | "Supervisor" | "Operador";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: "active" | "inactive";
  lastLogin?: string;
}

// Product lot control
export interface Batch {
  id: string;
  batchNumber: string;
  expirationDate: string; // ISO String (YYYY-MM-DD)
  quantity: number;
  receivedDate: string;
}

// Product representation
export interface Product {
  id: string;
  sku: string;         // Unique Internal Stock Keeping Unit code
  name: string;
  description: string;
  category: string;
  subcategory: string;
  unitOfMeasure: string; // "unidades", "kg", "m", "litros", etc.
  minStock: number;
  maxStock: number;
  avgCost: number;       // Average purchasing cost for valuation (PPP method)
  price: number;         // Public selling price
  currentStock: number;  // Total aggregated stock across all warehouses
  batches: Batch[];      // Batch info
  serialNumbers: string[]; // Serial numbers (optional)
  warehouseStock: Record<string, number>; // warehouseId -> current stock
  status: "active" | "inactive";
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Warehouse layout
export interface Warehouse {
  id: string;
  code: string;       // E.g., "ALM-01"
  name: string;
  address: string;
  zones: string[];    // E.g., ["A1-Estanteria", "B3-Frio"]
  status: "active" | "inactive";
}

// Subtypes of ledger transactions
export type MovementType = "entry" | "exit" | "adjustment";
export type MovementSubType = 
  | "purchase"       // Entry from Purchase Order
  | "production"     // Entry from recipe output / Consumed inside production
  | "return_client"  // Entry from Client Return
  | "sale"           // Exit from Sales Order
  | "internal_use"   // Exit for internal maintenance
  | "return_provider"// Exit to Supplier / Claim
  | "theft"          // Adjustment
  | "loss"           // Adjustment (broken, damage)
  | "reconciliation" // Adjustment after physical counting audit
  | "initial"        // Initial stock load
  | "transfer_exit"  // Stock transfer leaving a warehouse
  | "transfer_entry"; // Stock transfer entering a warehouse

export interface InventoryMovement {
  id: string;
  date: string;
  type: MovementType;
  subType: MovementSubType;
  productSku: string;
  productName: string;
  quantity: number;
  costBefore: number;
  costAfter: number;
  totalValue: number;       // quantity * average cost
  warehouseId: string;
  warehouseName: string;
  destWarehouseId?: string; // Only populated for "transfer_exit" / "transfer_entry"
  destWarehouseName?: string;
  batchNumber?: string;
  userEmail: string;
  notes: string;
}

// Business Entities
export interface Provider {
  id: string;
  name: string;
  taxId: string;       // NIT / RUT / CUIT
  email: string;
  phone: string;
  address: string;
  rating: number;      // 1-5 Performance evaluation
  balance: number;     // Accounts payable balance
  status: "active" | "inactive";
}

export interface Customer {
  id: string;
  name: string;
  taxId: string;
  email: string;
  phone: string;
  address: string;
  creditLimit: number;
  availableCredit: number;
  balance: number;     // Accounts receivable balance
  status: "active" | "inactive";
}

// Order Management Line Items
export interface OrderItem {
  productSku: string;
  productName: string;
  quantity: number;
  unitPrice: number;   // Unit Cost for Purchases, Selling Price for Sales
  total: number;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string; // OC-001, etc.
  providerId: string;
  providerName: string;
  items: OrderItem[];
  date: string;
  status: "draft" | "sent" | "received" | "cancelled";
  subtotal: number;
  taxes: number;       // Based on system IVA configuration (e.g. 19%)
  totalAmount: number;
  notes: string;
  invoiceNumber?: string;
}

export interface SalesOrder {
  id: string;
  orderNumber: string; // OV-001, etc.
  customerId: string;
  customerName: string;
  items: OrderItem[];
  date: string;
  status: "draft" | "processing" | "shipped" | "delivered" | "cancelled";
  subtotal: number;
  taxes: number;
  totalAmount: number;
  notes: string;
  deliveredBy?: string;
}

// MRP / Production / Formulas
export interface ProductionIngredient {
  productSku: string;
  productName: string;
  quantityNeeded: number; // Raw quantity needed relative to standardOutputQuantity
}

export interface ProductionFormula {
  id: string;
  name: string;
  productSku: string;    // Finished good produced
  productName: string;
  ingredients: ProductionIngredient[];
  standardOutputQuantity: number; // Batch standard (e.g., 10 bottles or 100 kgs)
  costEstimation: number; // Calculated dynamic cost based on components avgCost
}

export interface ProductionOrder {
  id: string;
  formulaId: string;
  formulaName: string;
  targetProductSku: string;
  targetProductName: string;
  targetQuantity: number;
  dateStarted: string;
  dateCompleted?: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  consumedStockDetails: { sku: string; quantity: number }[];
  notes: string;
}

// Enterprise Setting Records
export interface SystemConfig {
  companyName: string;
  currency: string;      // E.g., "USD", "COP", "EUR"
  currencySymbol: string; // E.g., "$", "€"
  taxRate: number;       // In percentage, e.g., 19
  alertMinStock: boolean;
  alertExpiryDays: number; // Standard is 30 or 60 days
}

// Enterprise Audit trails
export interface AuditLog {
  id: string;
  date: string;
  userEmail: string;
  userRole: UserRole;
  action: string;        // E.g., "CREACION_PRODUCTO", "REGISTRO_V_ORDEN", etc.
  module: string;        // "dashboard" | "productos" | "movimientos" | "compras" | "configuraciones" | "produccion" | "clientes" etc.
  details: string;       // Descriptive JSON or readable log string
  ipAddress: string;
}

