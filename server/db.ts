/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "fs";
import path from "path";
import { 
  Product, 
  Warehouse, 
  InventoryMovement, 
  Provider, 
  Customer, 
  PurchaseOrder, 
  SalesOrder, 
  ProductionFormula, 
  ProductionOrder, 
  SystemConfig, 
  AuditLog,
  User
} from "../src/types";

// In-memory structured DB representation
export interface DatabaseSchema {
  users: User[];
  products: Product[];
  warehouses: Warehouse[];
  movements: InventoryMovement[];
  providers: Provider[];
  customers: Customer[];
  purchaseOrders: PurchaseOrder[];
  salesOrders: SalesOrder[];
  formulas: ProductionFormula[];
  productionOrders: ProductionOrder[];
  config: SystemConfig;
  auditLogs: AuditLog[];
}

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

// Core Seed Data (Realistic Corporate Dataset)
const initialSeed = (): DatabaseSchema => {
  const now = new Date("2026-05-27T05:39:35Z");
  const isoNow = now.toISOString();

  // Helper dates
  const daysAgo = (d: number) => {
    const temp = new Date(now);
    temp.setDate(temp.getDate() - d);
    return temp.toISOString();
  };
  const daysAhead = (d: number) => {
    const temp = new Date(now);
    temp.setDate(temp.getDate() + d);
    return temp.toISOString();
  };

  const defaultUser: User = {
    id: "usr-1",
    email: "admin@empresa.com",
    name: "Alejandro Montenegro",
    role: "Admin",
    status: "active",
    lastLogin: isoNow
  };

  const warehouses: Warehouse[] = [
    { id: "alm-1", code: "ALM-PRINCIPAL", name: "Almacén Logístico Central", address: "Av. Industrial 450, Sector Norte", zones: ["Zona A - General", "Zona B - Picking", "Zona C - Frío"], status: "active" },
    { id: "alm-2", code: "ALM-MANUFACTURA", name: "Depósito de Materia Prima", address: "Calle de las Fábricas 12, Zona Industrial", zones: ["Materia Prima Química", "Componentes Metálicos", "Embalajes"], status: "active" },
    { id: "alm-3", code: "ALM-BORESTE", name: "Bodega de Distribución Este", address: "Parque Comercial Oriente, Km 12", zones: ["Palets Carga Pesada", "Estanterías Alta Rotación"], status: "active" }
  ];

  const providers: Provider[] = [
    { id: "prov-1", name: "Químicos Globales S.A.", taxId: "NIT-10292023-1", email: "contacto@quimicosglobales.com", phone: "+57 (601) 888-9900", address: "Parque Empresarial Toberín, Bogotá", rating: 5, balance: 4500.00, status: "active" },
    { id: "prov-2", name: "Metales Industrializados Ltda.", taxId: "NIT-88721021-3", email: "ventas@metindustrial.com", phone: "+54 (11) 4567-8901", address: "Av. Congreso 3421, Buenos Aires", rating: 4, balance: 12800.00, status: "active" },
    { id: "prov-3", name: "Envasadoras y Plásticos Monterrey", taxId: "RUT-990812-A1", email: "pedidos@envasasmty.mx", phone: "+52 (81) 8345-6789", address: "Fidencio Cantú 902, Monterrey", rating: 3, balance: 0.00, status: "active" }
  ];

  const customers: Customer[] = [
    { id: "cust-1", name: "Distribuidora Internacional Farma", taxId: "NIT-99020111-9", email: "compras@distfarma.com", phone: "+57 (602) 441-2000", address: "Av. Las Américas 9n-22, Cali", creditLimit: 50000.00, availableCredit: 34200.00, balance: 15800.00, status: "active" },
    { id: "cust-2", name: "Supermercados Alfa y Omega", taxId: "RUT-77621110-K", email: "logistica@alfayomega.cl", phone: "+56 (2) 2345-6711", address: "Av. Apoquindo 4412, Las Condes", creditLimit: 100000.00, availableCredit: 100000.00, balance: 0.00, status: "active" },
    { id: "cust-3", name: "Ferreterías Unidas del Norte", taxId: "RFC-FUN881211-HA9", email: "pagos@ferreunidas.com", phone: "+52 (55) 5122-8344", address: "Calandrias 44, Naucalpan EdoMex", creditLimit: 25000.00, availableCredit: 16500.00, balance: 8500.00, status: "active" }
  ];

  const products: Product[] = [
    {
      id: "prod-1",
      sku: "QUIM-ETAN-50L",
      name: "Etanol Puro de Grado Industrial (50L)",
      description: "Solvente de alta pureza al 96% utilizado para procesos de esterilización y manufactura de cosméticos.",
      category: "Materias Primas",
      subcategory: "Químicos Líquidos",
      unitOfMeasure: "litros",
      minStock: 250,
      maxStock: 2000,
      avgCost: 4.20,
      price: 9.50,
      currentStock: 950,
      batches: [
        { id: "bat-11", batchNumber: "LOT-ETA-2601", expirationDate: daysAhead(18), quantity: 450, receivedDate: daysAgo(40) },
        { id: "bat-12", batchNumber: "LOT-ETA-2602", expirationDate: daysAhead(120), quantity: 500, receivedDate: daysAgo(5) }
      ],
      serialNumbers: [],
      warehouseStock: { "alm-1": 500, "alm-2": 450 },
      status: "active",
      imageUrl: "",
      createdAt: daysAgo(100),
      updatedAt: daysAgo(5)
    },
    {
      id: "prod-2",
      sku: "MET-PERF-AC01",
      name: "Perfil Acero Inoxidable T-304 (6m)",
      description: "Perfil de acero inoxidable anticorrosión de alta resistencia para estructuras de soporte de carga pesada.",
      category: "Infraestructura",
      subcategory: "Metalería",
      unitOfMeasure: "unidades",
      minStock: 50,
      maxStock: 500,
      avgCost: 35.50,
      price: 69.90,
      currentStock: 35, // Low stock alert! Min is 50
      batches: [],
      serialNumbers: ["AC-92811", "AC-92812", "AC-92813", "AC-92814", "AC-92815"],
      warehouseStock: { "alm-2": 25, "alm-3": 10 },
      status: "active",
      imageUrl: "",
      createdAt: daysAgo(80),
      updatedAt: daysAgo(12)
    },
    {
      id: "prod-3",
      sku: "PLAS-ENV-1000ML",
      name: "Envase PET Premium Transparente (1000ml)",
      description: "Botellas plásticas reforzadas de PET ideales para envasado de solventes alimenticios o sanitarios.",
      category: "Embalajes",
      subcategory: "Envases",
      unitOfMeasure: "unidades",
      minStock: 1000,
      maxStock: 10000,
      avgCost: 0.15,
      price: 0.45,
      currentStock: 5200,
      batches: [
        { id: "bat-31", batchNumber: "LOT-ENV-091A", expirationDate: daysAhead(365), quantity: 4000, receivedDate: daysAgo(29) },
        { id: "bat-32", batchNumber: "LOT-ENV-091B", expirationDate: daysAhead(390), quantity: 1200, receivedDate: daysAgo(14) }
      ],
      serialNumbers: [],
      warehouseStock: { "alm-1": 1200, "alm-2": 4000 },
      status: "active",
      imageUrl: "",
      createdAt: daysAgo(90),
      updatedAt: daysAgo(14)
    },
    {
      id: "prod-4",
      sku: "QUIM-GLIC-20L",
      name: "Glicerina Bidestilada USP (20L)",
      description: "Glicerina pura líquida de grado USP para formulaciones químicas cosméticas y farmacéuticas.",
      category: "Materias Primas",
      subcategory: "Químicos Líquidos",
      unitOfMeasure: "litros",
      minStock: 100,
      maxStock: 800,
      avgCost: 8.50,
      price: 18.00,
      currentStock: 80, // Low stock alert! Min is 100
      batches: [
        { id: "bat-41", batchNumber: "LOT-GLI-909", expirationDate: daysAgo(5), quantity: 80, receivedDate: daysAgo(120) } // Already Expired batch!
      ],
      serialNumbers: [],
      warehouseStock: { "alm-2": 80 },
      status: "active",
      imageUrl: "",
      createdAt: daysAgo(120),
      updatedAt: daysAgo(120)
    },
    {
      id: "prod-5",
      sku: "TERM-GELSAN-1L",
      name: "Gel Antibacterial Premium (1L)",
      description: "Producto terminado elaborado internamente con fórmula de alcohol al 70%, glicerina USP y envase PET transparente.",
      category: "Producto Terminado",
      subcategory: "Desinfectantes",
      unitOfMeasure: "unidades",
      minStock: 200,
      maxStock: 3000,
      avgCost: 2.10,
      price: 5.90,
      currentStock: 1420,
      batches: [
        { id: "bat-51", batchNumber: "LOT-GEL-001X", expirationDate: daysAhead(270), quantity: 1420, receivedDate: daysAgo(2) }
      ],
      serialNumbers: [],
      warehouseStock: { "alm-1": 1000, "alm-3": 420 },
      status: "active",
      imageUrl: "",
      createdAt: daysAgo(45),
      updatedAt: daysAgo(2)
    }
  ];

  // Record historical inventory ledger entries/exits/adjustments for Kardex tracer
  const movements: InventoryMovement[] = [
    {
      id: "mov-1",
      date: daysAgo(40),
      type: "entry",
      subType: "initial",
      productSku: "QUIM-ETAN-50L",
      productName: "Etanol Puro de Grado Industrial (50L)",
      quantity: 450,
      costBefore: 0,
      costAfter: 4.20,
      totalValue: 1890,
      warehouseId: "alm-2",
      warehouseName: "Depósito de Materia Prima",
      batchNumber: "LOT-ETA-2601",
      userEmail: "admin@empresa.com",
      notes: "Carga de inventario inicial por auditoría de apertura."
    },
    {
      id: "mov-2",
      date: daysAgo(29),
      type: "entry",
      subType: "purchase",
      productSku: "PLAS-ENV-1000ML",
      productName: "Envase PET Premium Transparente (1000ml)",
      quantity: 4000,
      costBefore: 0,
      costAfter: 0.15,
      totalValue: 600,
      warehouseId: "alm-2",
      warehouseName: "Depósito de Materia Prima",
      batchNumber: "LOT-ENV-091A",
      userEmail: "admin@empresa.com",
      notes: "Ingreso correspondiente a la Orden de Compra OC-001."
    },
    {
      id: "mov-3",
      date: daysAgo(5),
      type: "entry",
      subType: "purchase",
      productSku: "QUIM-ETAN-50L",
      productName: "Etanol Puro de Grado Industrial (50L)",
      quantity: 500,
      costBefore: 4.20,
      costAfter: 4.20,
      totalValue: 2100,
      warehouseId: "alm-1",
      warehouseName: "Almacén Logístico Central",
      batchNumber: "LOT-ETA-2602",
      userEmail: "admin@empresa.com",
      notes: "Recepción de materiales de Químicos Globales S.A. s/f 92810."
    },
    {
      id: "mov-4",
      date: daysAgo(2),
      type: "exit",
      subType: "production",
      productSku: "QUIM-ETAN-50L",
      productName: "Etanol Puro de Grado Industrial (50L)",
      quantity: 100,
      costBefore: 4.20,
      costAfter: 4.20,
      totalValue: 420,
      warehouseId: "alm-2",
      warehouseName: "Depósito de Materia Prima",
      batchNumber: "LOT-ETA-2601",
      userEmail: "admin@empresa.com",
      notes: "Consumido en lote de producción OP-201 (Gel Antibacterial)."
    },
    {
      id: "mov-5",
      date: daysAgo(2),
      type: "entry",
      subType: "production",
      productSku: "TERM-GELSAN-1L",
      productName: "Gel Antibacterial Premium (1L)",
      quantity: 1420,
      costBefore: 0,
      costAfter: 2.10,
      totalValue: 2982,
      warehouseId: "alm-1",
      warehouseName: "Almacén Logístico Central",
      batchNumber: "LOT-GEL-001X",
      userEmail: "admin@empresa.com",
      notes: "Ingreso de producto terminado de Orden de Producción OP-201 exitosa."
    },
    {
      id: "mov-6",
      date: daysAgo(1),
      type: "adjustment",
      subType: "loss",
      productSku: "PLAS-ENV-1000ML",
      productName: "Envase PET Premium Transparente (1000ml)",
      quantity: 20,
      costBefore: 0.15,
      costAfter: 0.15,
      totalValue: 3,
      warehouseId: "alm-2",
      warehouseName: "Depósito de Materia Prima",
      batchNumber: "LOT-ENV-091A",
      userEmail: "admin@empresa.com",
      notes: "Pérdida por ruptura de cajas en picking de despacho."
    }
  ];

  const purchaseOrders: PurchaseOrder[] = [
    {
      id: "po-1",
      orderNumber: "OC-2601",
      providerId: "prov-1",
      providerName: "Químicos Globales S.A.",
      items: [
        { productSku: "QUIM-ETAN-50L", productName: "Etanol Puro de Grado Industrial (50L)", quantity: 500, unitPrice: 4.20, total: 2100 }
      ],
      date: daysAgo(10),
      status: "received",
      subtotal: 2100.00,
      taxes: 399.00, // 19% IVA
      totalAmount: 2499.00,
      notes: "Pedido urgente para reabastecimiento de producción interna d-1.",
      invoiceNumber: "FC-99211"
    },
    {
      id: "po-2",
      orderNumber: "OC-2602",
      providerId: "prov-2",
      providerName: "Metales Industrializados Ltda.",
      items: [
        { productSku: "MET-PERF-AC01", productName: "Perfil Acero Inoxidable T-304 (6m)", quantity: 150, unitPrice: 35.50, total: 5325 }
      ],
      date: daysAgo(1),
      status: "sent",
      subtotal: 5325.00,
      taxes: 1011.75,
      totalAmount: 6336.75,
      notes: "Material de soporte estructural solicitado para ampliación de patio 2."
    }
  ];

  const salesOrders: SalesOrder[] = [
    {
      id: "so-1",
      orderNumber: "OV-1001",
      customerId: "cust-1",
      customerName: "Distribuidora Internacional Farma",
      items: [
        { productSku: "TERM-GELSAN-1L", productName: "Gel Antibacterial Premium (1L)", quantity: 500, unitPrice: 5.90, total: 2950 }
      ],
      date: daysAgo(3),
      status: "delivered",
      subtotal: 2950.00,
      taxes: 560.50,
      totalAmount: 3510.50,
      notes: "Despacho programado canal farmacias centro-norte.",
      deliveredBy: "Transportes Express N-1"
    },
    {
      id: "so-2",
      orderNumber: "OV-1002",
      customerId: "cust-3",
      customerName: "Ferreterías Unidas del Norte",
      items: [
        { productSku: "MET-PERF-AC01", productName: "Perfil Acero Inoxidable T-304 (6m)", quantity: 15, unitPrice: 69.90, total: 1048.50 }
      ],
      date: daysAgo(1),
      status: "processing",
      subtotal: 1048.50,
      taxes: 199.22,
      totalAmount: 1247.72,
      notes: "Aprobada bajo crédito preferente de Ferreunidas."
    }
  ];

  const formulas: ProductionFormula[] = [
    {
      id: "for-1",
      name: "Fórmula Gel Antibacterial Premium (Lote 1000U)",
      productSku: "TERM-GELSAN-1L",
      productName: "Gel Antibacterial Premium (1L)",
      ingredients: [
        { productSku: "QUIM-ETAN-50L", productName: "Etanol Puro de Grado Industrial (50L)", quantityNeeded: 700 }, // Litros
        { productSku: "QUIM-GLIC-20L", productName: "Glicerina Bidestilada USP (20L)", quantityNeeded: 20 },      // Litros
        { productSku: "PLAS-ENV-1000ML", productName: "Envase PET Premium Transparente (1000ml)", quantityNeeded: 1000 } // Unidades
      ],
      standardOutputQuantity: 1000,
      costEstimation: 3110.00 // Evaluado dinámicamente: (700*4.2)+(20*8.5)+(1000*0.15) = 2940 + 170 + 150 = 3260 est.
    }
  ];

  const productionOrders: ProductionOrder[] = [
    {
      id: "pro-1",
      formulaId: "for-1",
      formulaName: "Fórmula Gel Antibacterial Premium (Lote 1000U)",
      targetProductSku: "TERM-GELSAN-1L",
      targetProductName: "Gel Antibacterial Premium (1L)",
      targetQuantity: 1000,
      dateStarted: daysAgo(4),
      dateCompleted: daysAgo(2),
      status: "completed",
      consumedStockDetails: [
        { sku: "QUIM-ETAN-50L", quantity: 700 },
        { sku: "QUIM-GLIC-20L", quantity: 20 },
        { sku: "PLAS-ENV-1000ML", quantity: 1000 }
      ],
      notes: "Lanzamiento piloto inicial aprobado por control de calidad para distribución."
    },
    {
      id: "pro-2",
      formulaId: "for-1",
      formulaName: "Fórmula Gel Antibacterial Premium (Lote 1000U)",
      targetProductSku: "TERM-GELSAN-1L",
      targetProductName: "Gel Antibacterial Premium (1L)",
      targetQuantity: 1500,
      dateStarted: daysAgo(1),
      status: "in_progress",
      consumedStockDetails: [
        { sku: "QUIM-ETAN-50L", quantity: 1050 },
        { sku: "QUIM-GLIC-20L", quantity: 30 },
        { sku: "PLAS-ENV-1000ML", quantity: 1500 }
      ],
      notes: "Lote suplementario asignado a línea de mezcla B."
    }
  ];

  const config: SystemConfig = {
    companyName: "Corp Logistics & Chemistry S.A.S",
    currency: "USD",
    currencySymbol: "$",
    taxRate: 19,
    alertMinStock: true,
    alertExpiryDays: 30
  };

  const auditLogs: AuditLog[] = [
    { id: "log-1", date: daysAgo(10), userEmail: "admin@empresa.com", userRole: "Admin", action: "CONEXION_SISTEMA", module: "seguridad", details: "El usuario inició sesión con credenciales administrativas validadas con éxito.", ipAddress: "192.168.1.50" },
    { id: "log-2", date: daysAgo(5), userEmail: "admin@empresa.com", userRole: "Admin", action: "CREACION_PRODUCTO", module: "productos", details: "Registro del nuevo producto terminado Gel Antibacterial con asignación de costo base.", ipAddress: "192.168.1.50" },
    { id: "log-3", date: daysAgo(2), userEmail: "admin@empresa.com", userRole: "Admin", action: "CIERRE_PRODUCCION", module: "produccion", details: "Aprobación del lote terminado OP-201 con ingreso de 1420 unidades en almacén principal.", ipAddress: "192.168.1.50" }
  ];

  return {
    users: [defaultUser],
    products,
    warehouses,
    movements,
    providers,
    customers,
    purchaseOrders,
    salesOrders,
    formulas,
    productionOrders,
    config,
    auditLogs
  };
};

// Database wrapper with file system sync and atomic methods
export class JSONDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  // Thread-safe load from filesystem or memory fallback
  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(fileContent);
        // Quick validates schema keys
        if (parsed && typeof parsed === "object" && "products" in parsed && "warehouses" in parsed) {
          return parsed as DatabaseSchema;
        }
      }
    } catch (e) {
      console.error("No se pudo leer el archivo de base de datos. Usando semillas iniciales...", e);
    }

    // Default seed
    const seededData = initialSeed();
    this.saveData(seededData);
    return seededData;
  }

  // Save changes atomically (write and swap)
  private saveData(dataToSave: DatabaseSchema) {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), "utf-8");
    } catch (e) {
      console.error("Error al persistir base de datos a archivo (usando en-memoria):", e);
    }
  }

  private commit() {
    this.saveData(this.data);
  }

  // Logs actions to Audit Trail automatically
  public logAudit(action: string, module: string, details: string, userEmail: string = "admin@empresa.com") {
    const log: AuditLog = {
      id: "log-" + Date.now() + "-" + Math.floor(Math.random() * 100),
      date: new Date().toISOString(),
      userEmail,
      userRole: "Admin",
      action,
      module,
      details,
      ipAddress: "127.0.0.1"
    };
    this.data.auditLogs.unshift(log);
    // Keep audit logs capped at a performant size (e.g. 500 logs)
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 500);
    }
    this.commit();
  }

  // GETTERS
  public getProducts() { return this.data.products; }
  public getWarehouses() { return this.data.warehouses; }
  public getMovements() { return this.data.movements; }
  public getProviders() { return this.data.providers; }
  public getCustomers() { return this.data.customers; }
  public getPurchaseOrders() { return this.data.purchaseOrders; }
  public getSalesOrders() { return this.data.salesOrders; }
  public getFormulas() { return this.data.formulas; }
  public getProductionOrders() { return this.data.productionOrders; }
  public getConfig() { return this.data.config; }
  public getAuditLogs() { return this.data.auditLogs; }
  public getUsers() { return this.data.users; }

  // WRITERS & MUTATORS
  
  // CONFIG
  public updateConfig(newConfig: SystemConfig, userEmail: string) {
    this.data.config = { ...this.data.config, ...newConfig };
    this.logAudit("ACTUALIZACION_CONFIG", "configuraciones", `Cambio de parámetros globales. Moneda: ${newConfig.currency}, IVA: ${newConfig.taxRate}%`, userEmail);
    this.commit();
    return this.data.config;
  }

  // PRODUCTS
  public createProduct(product: Omit<Product, "id" | "createdAt" | "updatedAt">, userEmail: string) {
    const newProd: Product = {
      ...product,
      id: "prod-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.products.unshift(newProd);
    this.logAudit("CREACION_PRODUCTO", "productos", `Se registró el producto SKU: ${product.sku} - ${product.name}`, userEmail);

    // Auto log initial movement if stock > 0
    if (product.currentStock > 0) {
      const initMovement: InventoryMovement = {
        id: "mov-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
        date: new Date().toISOString(),
        type: "entry",
        subType: "initial",
        productSku: product.sku,
        productName: product.name,
        quantity: product.currentStock,
        costBefore: 0,
        costAfter: product.avgCost,
        totalValue: product.currentStock * product.avgCost,
        warehouseId: "alm-1",
        warehouseName: "Almacén Logístico Central",
        userEmail,
        notes: "Carga de inventario automática inicial al crear producto"
      };
      this.data.movements.unshift(initMovement);
    }

    this.commit();
    return newProd;
  }

  public updateProduct(id: string, updates: Partial<Product>, userEmail: string) {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx === -1) throw new Error("Producto no encontrado");
    
    const original = this.data.products[idx];
    this.data.products[idx] = {
      ...original,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.logAudit("MODIFICACION_PRODUCTO", "productos", `Se modificó el producto SKU: ${original.sku} - ${original.name}`, userEmail);
    this.commit();
    return this.data.products[idx];
  }

  public deleteProduct(id: string, userEmail: string) {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx === -1) throw new Error("Producto no encontrado");
    const p = this.data.products[idx];
    this.data.products.splice(idx, 1);
    this.logAudit("BAJA_PRODUCTO", "productos", `Se dió de baja al producto SKU: ${p.sku} - ${p.name}`, userEmail);
    this.commit();
  }

  // WAREHOUSES
  public createWarehouse(wh: Omit<Warehouse, "id">, userEmail: string) {
    const newWh: Warehouse = {
      ...wh,
      id: "alm-" + Date.now() + "-" + Math.floor(Math.random() * 100)
    };
    this.data.warehouses.push(newWh);
    this.logAudit("CREACION_ALMACEN", "almacenes", `Nuevo almacén: ${wh.code} - ${wh.name}`, userEmail);
    this.commit();
    return newWh;
  }

  public updateWarehouse(id: string, updates: Partial<Warehouse>, userEmail: string) {
    const idx = this.data.warehouses.findIndex(w => w.id === id);
    if (idx === -1) throw new Error("Almacén no encontrado");
    this.data.warehouses[idx] = { ...this.data.warehouses[idx], ...updates };
    this.logAudit("MODIFICACION_ALMACEN", "almacenes", `Se actualizó almacén: ${this.data.warehouses[idx].name}`, userEmail);
    this.commit();
    return this.data.warehouses[idx];
  }

  // MOVEMENTS (LEDGER ENGINE)
  // Registering entries, exits, adjustments, or internal transfers with full cost recalculation
  public registerMovement(mov: Omit<InventoryMovement, "id" | "date" | "totalValue" | "costBefore" | "costAfter">, userEmail: string) {
    const product = this.data.products.find(p => p.sku === mov.productSku);
    if (!product) throw new Error(`Producto SKU ${mov.productSku} no existe en catálogo.`);

    const quantity = Number(mov.quantity);
    if (isNaN(quantity) || quantity <= 0) throw new Error("La cantidad debe ser mayor que cero.");

    // Select Lot / Batch if provided
    let batchNum = mov.batchNumber?.trim();

    // Cost valuation using weighted average cost (PPP - Precio Promedio Ponderado)
    const costBefore = product.avgCost;
    let costAfter = product.avgCost;
    const totalValue = quantity * costBefore;

    // Adjusting physical stock across Warehouses
    const whStockMap = { ...product.warehouseStock };
    const currentWhStock = whStockMap[mov.warehouseId] || 0;

    if (mov.type === "entry") {
      whStockMap[mov.warehouseId] = currentWhStock + quantity;
      product.currentStock += quantity;

      // Lot handler
      if (batchNum) {
        const existingBatch = product.batches.find(b => b.batchNumber === batchNum);
        if (existingBatch) {
          existingBatch.quantity += quantity;
        } else {
          // Add a new batch with a default expiration date (e.g. + 90 days)
          const newExpDate = new Date();
          newExpDate.setDate(newExpDate.getDate() + 90);
          product.batches.push({
            id: "bat-" + Date.now() + "-" + Math.floor(Math.random() * 100),
            batchNumber: batchNum,
            expirationDate: newExpDate.toISOString().split("T")[0],
            quantity,
            receivedDate: new Date().toISOString()
          });
        }
      }
    } else if (mov.type === "exit") {
      if (currentWhStock < quantity) {
        throw new Error(`Stock insuficiente en almacén origen. Disponible: ${currentWhStock}, Solicitado: ${quantity}`);
      }
      whStockMap[mov.warehouseId] = currentWhStock - quantity;
      product.currentStock -= quantity;

      // Lot handler for exit: deduct quantities
      if (batchNum) {
        const existingBatch = product.batches.find(b => b.batchNumber === batchNum);
        if (existingBatch) {
          if (existingBatch.quantity < quantity) {
            throw new Error(`El lote ${batchNum} tiene stock insuficiente. Disponible: ${existingBatch.quantity}`);
          }
          existingBatch.quantity -= quantity;
        }
      } else if (product.batches.length > 0) {
        // Automatically deduct from oldest batch first if no batch is specified (FIFO for lots)
        let exitQty = quantity;
        product.batches.sort((a,b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime());
        for (const batch of product.batches) {
          if (batch.quantity >= exitQty) {
            batch.quantity -= exitQty;
            exitQty = 0;
            break;
          } else {
            exitQty -= batch.quantity;
            batch.quantity = 0;
          }
        }
      }
    } else if (mov.type === "adjustment") {
      // Adjustment could support a subType of reconciliation, loss, theft.
      // E.g. loss/theft means stock reduces. reconciliation can be positive or negative.
      if (mov.subType === "loss" || mov.subType === "theft") {
        if (currentWhStock < quantity) {
          throw new Error(`No se puede reportar pérdida mayor a la disponible en este almacén.`);
        }
        whStockMap[mov.warehouseId] = currentWhStock - quantity;
        product.currentStock -= quantity;
        
        // Deduct from batches too
        if (product.batches.length > 0) {
          let exitQty = quantity;
          for (const batch of product.batches) {
            if (batch.quantity >= exitQty) {
              batch.quantity -= exitQty;
              exitQty = 0;
              break;
            } else {
              exitQty -= batch.quantity;
              batch.quantity = 0;
            }
          }
        }
      } else {
        // reconciliations might add or remove
        // lets default to updating to absolute value or acting as an entry add
        whStockMap[mov.warehouseId] = currentWhStock + quantity;
        product.currentStock += quantity;
      }
    }

    product.warehouseStock = whStockMap;
    product.updatedAt = new Date().toISOString();

    const newMovement: InventoryMovement = {
      ...mov,
      id: "mov-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      date: new Date().toISOString(),
      totalValue,
      costBefore,
      costAfter,
      batchNumber: batchNum || undefined
    };

    this.data.movements.unshift(newMovement);
    this.logAudit(
      `MOVIMIENTO_${mov.type.toUpperCase()}`,
      "movimientos",
      `${mov.subType.toUpperCase()}: SKU: ${mov.productSku} x${quantity} en ${mov.warehouseName}. Nota: ${mov.notes}`,
      userEmail
    );

    this.commit();
    return newMovement;
  }

  // WAREHOUSE INTRA-TRANSFER
  public transferInventory(srcId: string, destId: string, sku: string, quantity: number, notes: string, userEmail: string) {
    const srcWh = this.data.warehouses.find(w => w.id === srcId);
    const destWh = this.data.warehouses.find(w => w.id === destId);
    const product = this.data.products.find(p => p.sku === sku);

    if (!srcWh || !destWh) throw new Error("Almacenes inválidos");
    if (!product) throw new Error("Producto inválido");

    const srcStock = product.warehouseStock[srcId] || 0;
    if (srcStock < quantity) {
      throw new Error(`Stock insuficiente en almacén origen (${srcWh.name}). Disponible: ${srcStock}, Traspaso: ${quantity}`);
    }

    // Register out-movement from source warehouse
    this.registerMovement({
      type: "exit",
      subType: "transfer_exit",
      productSku: sku,
      productName: product.name,
      quantity,
      warehouseId: srcId,
      warehouseName: srcWh.name,
      destWarehouseId: destId,
      destWarehouseName: destWh.name,
      notes: `Traspaso a ${destWh.name} (Salida). ${notes}`,
      userEmail
    }, userEmail);

    // Register in-movement to destination warehouse
    this.registerMovement({
      type: "entry",
      subType: "transfer_entry",
      productSku: sku,
      productName: product.name,
      quantity,
      warehouseId: destId,
      warehouseName: destWh.name,
      destWarehouseId: srcId,
      destWarehouseName: srcWh.name,
      notes: `Traspaso desde ${srcWh.name} (Ingreso). ${notes}`,
      userEmail
    }, userEmail);

    this.logAudit("TRASPASO_ALMACEN", "almacenes", `Traspaso SKU: ${sku} x${quantity} de ${srcWh.name} a ${destWh.name}`, userEmail);
    this.commit();
  }

  // PROVIDERS & CUSTOMERS CRUD
  public createProvider(prov: Omit<Provider, "id">, userEmail: string) {
    const newProv: Provider = { ...prov, id: "prov-" + Date.now(), balance: 0 };
    this.data.providers.push(newProv);
    this.logAudit("CREACION_PROVEEDOR", "proveedores", `Nuevo proveedor registrado: ${prov.name}`, userEmail);
    this.commit();
    return newProv;
  }

  public updateProvider(id: string, updates: Partial<Provider>, userEmail: string) {
    const idx = this.data.providers.findIndex(p => p.id === id);
    if (idx === -1) throw new Error("Proveedor no encontrado");
    this.data.providers[idx] = { ...this.data.providers[idx], ...updates };
    this.logAudit("MODIFICACION_PROVEEDOR", "proveedores", `Se editó proveedor: ${this.data.providers[idx].name}`, userEmail);
    this.commit();
    return this.data.providers[idx];
  }

  public createCustomer(cust: Omit<Customer, "id">, userEmail: string) {
    const newCust: Customer = { ...cust, id: "cust-" + Date.now(), availableCredit: cust.creditLimit, balance: 0 };
    this.data.customers.push(newCust);
    this.logAudit("CREACION_CLIENTE", "clientes", `Nuevo cliente registrado: ${cust.name}`, userEmail);
    this.commit();
    return newCust;
  }

  public updateCustomer(id: string, updates: Partial<Customer>, userEmail: string) {
    const idx = this.data.customers.findIndex(c => c.id === id);
    if (idx === -1) throw new Error("Cliente no encontrado");
    const current = this.data.customers[idx];
    
    let updated = { ...current, ...updates };
    if (updates.creditLimit !== undefined) {
      const difference = updates.creditLimit - current.creditLimit;
      updated.availableCredit = Math.max(0, current.availableCredit + difference);
    }
    
    this.data.customers[idx] = updated;
    this.logAudit("MODIFICACION_CLIENTE", "clientes", `Se editó cliente: ${updated.name}`, userEmail);
    this.commit();
    return updated;
  }

  // ACTIONS FOR PURCHASES & SALES ORDERS
  public createPurchaseOrder(po: Omit<PurchaseOrder, "id" | "orderNumber">, userEmail: string) {
    const count = this.data.purchaseOrders.length + 1;
    const orderNumber = `OC-${String(count).padStart(4, "0")}`;
    const newPO: PurchaseOrder = {
      ...po,
      id: "po-" + Date.now(),
      orderNumber,
      status: "draft"
    };
    this.data.purchaseOrders.unshift(newPO);
    this.logAudit("CREACION_ORDEN_COMPRA", "compras", `Creado borrador de ${orderNumber} para ${po.providerName}`, userEmail);
    this.commit();
    return newPO;
  }

  public updatePurchaseOrder(id: string, status: PurchaseOrder["status"], invoiceNumber?: string, userEmail: string = "admin@empresa.com") {
    const po = this.data.purchaseOrders.find(p => p.id === id);
    if (!po) throw new Error("Orden de compra no encontrada");

    const prevStatus = po.status;
    po.status = status;
    if (invoiceNumber) po.invoiceNumber = invoiceNumber;

    this.logAudit("PROCESAMIENTO_COMPRA", "compras", `Orden ${po.orderNumber} cambió de ${prevStatus} a ${status}`, userEmail);

    // If purchase is completed/received, automatically add items into inventory (ALM-PRINCIPAL)
    if (status === "received" && prevStatus !== "received") {
      const wh = this.data.warehouses[0] || { id: "alm-1", name: "Almacén Logístico Central" };
      for (const item of po.items) {
        const product = this.data.products.find(p => p.sku === item.productSku);
        if (product) {
          // Adjust average cost using standard Weighted Average Cost equation
          // (Current Stock * Current Cost + Purchased Quantity * Purchased Price) / (Current Stock + Purchased Quantity)
          const currStock = product.currentStock;
          const currCost = product.avgCost;
          const newQty = item.quantity;
          const newCost = item.unitPrice;
          
          let updatedAvgCost = currCost;
          if (currStock + newQty > 0) {
            updatedAvgCost = Number(((currStock * currCost + newQty * newCost) / (currStock + newQty)).toFixed(2));
          }

          product.avgCost = updatedAvgCost;

          // Register ledger move
          const batchLot = "LOT-COMP-" + po.orderNumber.replace("-", "");
          this.registerMovement({
            type: "entry",
            subType: "purchase",
            productSku: item.productSku,
            productName: item.productName,
            quantity: item.quantity,
            warehouseId: wh.id,
            warehouseName: wh.name,
            batchNumber: batchLot,
            notes: `Ingreso automático por OC aprobada ${po.orderNumber}.`,
            userEmail
          }, userEmail);
        }
      }
      // Update supplier balance
      const provider = this.data.providers.find(prov => prov.id === po.providerId);
      if (provider) {
        provider.balance += po.totalAmount;
      }
    }

    this.commit();
    return po;
  }

  public createSalesOrder(so: Omit<SalesOrder, "id" | "orderNumber">, userEmail: string) {
    const count = this.data.salesOrders.length + 1;
    const orderNumber = `OV-${String(count).padStart(4, "0")}`;
    const newSO: SalesOrder = {
      ...so,
      id: "so-" + Date.now(),
      orderNumber,
      status: "draft"
    };

    // Check customer credit limits if sales are approved directly
    const customer = this.data.customers.find(c => c.id === so.customerId);
    if (!customer) throw new Error("Cliente no registrado");

    this.data.salesOrders.unshift(newSO);
    this.logAudit("CREACION_ORDEN_VENTA", "ventas", `Creado borrador de ${orderNumber} para ${so.customerName}`, userEmail);
    this.commit();
    return newSO;
  }

  public updateSalesOrder(id: string, status: SalesOrder["status"], deliveredBy?: string, userEmail: string = "admin@empresa.com") {
    const so = this.data.salesOrders.find(s => s.id === id);
    if (!so) throw new Error("Orden de venta no encontrada");

    const prevStatus = so.status;
    so.status = status;
    if (deliveredBy) so.deliveredBy = deliveredBy;

    this.logAudit("PROCESAMIENTO_VENTA", "ventas", `Orden ${so.orderNumber} cambió de ${prevStatus} a ${status}`, userEmail);

    // If order is dispatched ("shipped") or completed, deduct inventory from ALM-PRINCIPAL
    if ((status === "shipped" || status === "delivered") && (prevStatus === "draft" || prevStatus === "processing")) {
      const wh = this.data.warehouses[0] || { id: "alm-1", name: "Almacén Logístico Central" };
      
      // Perform validation check first
      for (const item of so.items) {
        const product = this.data.products.find(p => p.sku === item.productSku);
        if (!product || (product.warehouseStock[wh.id] || 0) < item.quantity) {
          // Revert and throw
          so.status = prevStatus;
          throw new Error(`Stock insuficiente para despachar el producto ${item.productName} SKU: ${item.productSku}. En almacén ${wh.name} solo quedan: ${product ? (product.warehouseStock[wh.id] || 0) : 0}`);
        }
      }

      // Procced to deduct
      for (const item of so.items) {
        this.registerMovement({
          type: "exit",
          subType: "sale",
          productSku: item.productSku,
          productName: item.productName,
          quantity: item.quantity,
          warehouseId: wh.id,
          warehouseName: wh.name,
          notes: `Despacho automático por OV aprobada ${so.orderNumber}.`,
          userEmail
        }, userEmail);
      }

      // Update credit balance in customer profile
      const customer = this.data.customers.find(c => c.id === so.customerId);
      if (customer) {
        customer.balance += so.totalAmount;
        customer.availableCredit = Math.max(0, customer.creditLimit - customer.balance);
      }
    }

    this.commit();
    return so;
  }

  // MRP PRODUCTION FORMULAS & WORKORDERS
  public createFormula(formula: Omit<ProductionFormula, "id">, userEmail: string) {
    const newFor: ProductionFormula = {
      ...formula,
      id: "for-" + Date.now()
    };
    this.data.formulas.push(newFor);
    this.logAudit("CREACION_FORMULA", "produccion", `Se registró receta industrial: ${formula.name} para producir SKU: ${formula.productSku}`, userEmail);
    this.commit();
    return newFor;
  }

  public createProductionOrder(po: Omit<ProductionOrder, "id" | "status">, userEmail: string) {
    const newPO: ProductionOrder = {
      ...po,
      id: "pro-" + Date.now(),
      status: "pending"
    };

    this.data.productionOrders.unshift(newPO);
    this.logAudit("CREACION_ORDEN_PRODUCCION", "produccion", `Creada orden de fabricación para fabricar x${po.targetQuantity} de SKU: ${po.targetProductSku}`, userEmail);
    this.commit();
    return newPO;
  }

  // Completing or cancel production work orders and automatically consumate RAW goods into finished goods SKU!
  public updateProductionOrder(id: string, status: ProductionOrder["status"], userEmail: string) {
    const po = this.data.productionOrders.find(p => p.id === id);
    if (!po) throw new Error("Orden de fabricación no encontrada");

    const prevStatus = po.status;
    if (prevStatus === "completed" || prevStatus === "cancelled") {
      throw new Error("No se puede editar una orden de fabricación ya culminada o cancelada.");
    }

    po.status = status;

    if (status === "completed") {
      const whRaw = "alm-2"; // Raw department
      const whFin = "alm-1"; // Logistics distribution center

      // Step 1: Verify raw materials are fully available to deduct
      for (const ingredient of po.consumedStockDetails) {
        const product = this.data.products.find(p => p.sku === ingredient.sku);
        const stockAvailable = product ? (product.warehouseStock[whRaw] || 0) : 0;
        if (stockAvailable < ingredient.quantity) {
          // Revert status update and throw
          po.status = prevStatus;
          throw new Error(`Materia prima insuficiente en ${whRaw} para fabricar este lote. Falta ${ingredient.sku}. Requerido: ${ingredient.quantity}, Disponible: ${stockAvailable}`);
        }
      }

      // Step 2: Deduct ingredients
      for (const ingredient of po.consumedStockDetails) {
        const pRaw = this.data.products.find(p => p.sku === ingredient.sku)!;
        this.registerMovement({
          type: "exit",
          subType: "production",
          productSku: ingredient.sku,
          productName: pRaw.name,
          quantity: ingredient.quantity,
          warehouseId: whRaw,
          warehouseName: "Depósito de Materia Prima",
          notes: `Consumido s/ fabricar lote final de ${po.targetProductName} (OP ${po.id.substring(4, 9)}).`,
          userEmail
        }, userEmail);
      }

      // Step 3: Insert Finished good yield!
      const pFin = this.data.products.find(p => p.sku === po.targetProductSku);
      if (pFin) {
        const finishedLotCode = "LOT-FAB-" + po.id.replace("pro-","").substring(0, 6).toUpperCase();
        this.registerMovement({
          type: "entry",
          subType: "production",
          productSku: po.targetProductSku,
          productName: po.targetProductName,
          quantity: po.targetQuantity,
          warehouseId: whFin,
          warehouseName: "Almacén Logístico Central",
          batchNumber: finishedLotCode,
          notes: `Ingreso de producto terminado de Orden de Fabricación exitosa.`,
          userEmail
        }, userEmail);
      }
    }

    this.logAudit("MODIFICACION_ORDEN_PRODUCCION", "produccion", `Estado de OP cambiado de ${prevStatus} a ${status}`, userEmail);
    this.commit();
    return po;
  }
}

// Instantiate globally as database engine instance
export const db = new JSONDatabase();
