/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { db } from "./server/db";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Global parse middlewares
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Helper error wrapper for endpoints
  const asyncHandler = (fn: (req: Request, res: Response) => Promise<any> | any) => {
    return async (req: Request, res: Response, next: any) => {
      try {
        await fn(req, res);
      } catch (err: any) {
        console.error("API Error occurred: ", err);
        res.status(400).json({ 
          success: false, 
          error: err.message || "Ocurrió un error inesperado en el servidor empresarial." 
        });
      }
    };
  };

  // ==========================================
  // REST API SYSTEM ENDPOINTS
  // ==========================================

  // Global Settings and Configs
  app.get(["/api/config", "/api/settings"], asyncHandler((req, res) => {
    res.json(db.getConfig());
  }));

  app.post(["/api/config", "/api/settings"], asyncHandler((req, res) => {
    const updated = db.updateConfig(req.body, "admin@empresa.com");
    res.json({ success: true, data: updated });
  }));

  // Catalogue Products
  app.get("/api/products", asyncHandler((req, res) => {
    res.json(db.getProducts());
  }));

  app.post("/api/products", asyncHandler((req, res) => {
    const productData = req.body;
    
    // Explicit server-side validations
    if (!productData.sku || !productData.sku.trim()) {
      throw new Error("El SKU del producto es estrictamente obligatorio para la trazabilidad.");
    }
    if (!productData.name || !productData.name.trim()) {
      throw new Error("El nombre de producto es mandatorio.");
    }
    
    // Check duplication of SKU
    const skuExists = db.getProducts().some(p => p.sku === productData.sku);
    if (skuExists) {
      throw new Error(`El código SKU '${productData.sku}' ya está registrado en el sistema de inventario.`);
    }

    const created = db.createProduct(productData, "admin@empresa.com");
    res.status(201).json({ success: true, data: created });
  }));

  app.put("/api/products/:id", asyncHandler((req, res) => {
    const { id } = req.params;
    const updated = db.updateProduct(id, req.body, "admin@empresa.com");
    res.json({ success: true, data: updated });
  }));

  app.delete("/api/products/:id", asyncHandler((req, res) => {
    const { id } = req.params;
    db.deleteProduct(id, "admin@empresa.com");
    res.json({ success: true, message: "Producto eliminado correctamente del catálogo." });
  }));

  // Warehouse Management
  app.get("/api/warehouses", asyncHandler((req, res) => {
    res.json(db.getWarehouses());
  }));

  app.post("/api/warehouses", asyncHandler((req, res) => {
    const created = db.createWarehouse(req.body, "admin@empresa.com");
    res.status(201).json({ success: true, data: created });
  }));

  app.put("/api/warehouses/:id", asyncHandler((req, res) => {
    const updated = db.updateWarehouse(req.params.id, req.body, "admin@empresa.com");
    res.json({ success: true, data: updated });
  }));

  app.post("/api/warehouses/transfer", asyncHandler((req, res) => {
    const { srcWarehouseId, destWarehouseId, productSku, quantity, notes } = req.body;
    if (!srcWarehouseId || !destWarehouseId || !productSku || !quantity) {
      throw new Error("Parámetros insuficientes: Se requiere almacén de crígen, de destino, SKU y cantidad de transferencia.");
    }
    if (srcWarehouseId === destWarehouseId) {
      throw new Error("El almacén de origen no puede ser igual al de destino.");
    }
    db.transferInventory(srcWarehouseId, destWarehouseId, productSku, Number(quantity), notes || "", "admin@empresa.com");
    res.json({ success: true, message: "Traspaso inter-almacén procesado con éxito." });
  }));

  // Inventory Ledger / Movements
  app.get("/api/movements", asyncHandler((req, res) => {
    res.json(db.getMovements());
  }));

  app.post(["/api/movements", "/api/products/adjust"], asyncHandler((req, res) => {
    // Creates high audit ledger logs
    const created = db.registerMovement(req.body, "admin@empresa.com");
    res.status(201).json({ success: true, data: created });
  }));

  // Third-Party Partners (Providers / Suppliers)
  app.get(["/api/providers", "/api/relations/providers"], asyncHandler((req, res) => {
    res.json(db.getProviders());
  }));

  app.post(["/api/providers", "/api/relations/providers"], asyncHandler((req, res) => {
    const created = db.createProvider(req.body, "admin@empresa.com");
    res.status(201).json({ success: true, data: created });
  }));

  app.put(["/api/providers/:id", "/api/relations/providers/:id"], asyncHandler((req, res) => {
    const updated = db.updateProvider(req.params.id, req.body, "admin@empresa.com");
    res.json({ success: true, data: updated });
  }));

  // Customers / Clients
  app.get(["/api/customers", "/api/relations/customers"], asyncHandler((req, res) => {
    res.json(db.getCustomers());
  }));

  app.post(["/api/customers", "/api/relations/customers"], asyncHandler((req, res) => {
    const created = db.createCustomer(req.body, "admin@empresa.com");
    res.status(201).json({ success: true, data: created });
  }));

  app.put(["/api/customers/:id", "/api/relations/customers/:id"], asyncHandler((req, res) => {
    const updated = db.updateCustomer(req.params.id, req.body, "admin@empresa.com");
    res.json({ success: true, data: updated });
  }));

  // Purchase Order Operations (Supply Chain)
  app.get(["/api/orders/purchase", "/api/orders/purchases"], asyncHandler((req, res) => {
    res.json(db.getPurchaseOrders());
  }));

  app.post(["/api/orders/purchase", "/api/orders/purchases"], asyncHandler((req, res) => {
    const created = db.createPurchaseOrder(req.body, "admin@empresa.com");
    res.status(201).json({ success: true, data: created });
  }));

  app.put(["/api/orders/purchase/:id", "/api/orders/purchases/:id"], asyncHandler((req, res) => {
    const { status, invoiceNumber } = req.body;
    const po = db.updatePurchaseOrder(req.params.id, status, invoiceNumber, "admin@empresa.com");
    res.json({ success: true, data: po });
  }));

  // Sales Order Operations (Invoicing & Dispatches)
  app.get("/api/orders/sales", asyncHandler((req, res) => {
    res.json(db.getSalesOrders());
  }));

  app.post("/api/orders/sales", asyncHandler((req, res) => {
    const created = db.createSalesOrder(req.body, "admin@empresa.com");
    res.status(201).json({ success: true, data: created });
  }));

  app.put("/api/orders/sales/:id", asyncHandler((req, res) => {
    const { status, deliveredBy } = req.body;
    const so = db.updateSalesOrder(req.params.id, status, deliveredBy, "admin@empresa.com");
    res.json({ success: true, data: so });
  }));

  // Production Formula Engineering & Execution
  app.get("/api/production/formulas", asyncHandler((req, res) => {
    res.json(db.getFormulas());
  }));

  app.post("/api/production/formulas", asyncHandler((req, res) => {
    const created = db.createFormula(req.body, "admin@empresa.com");
    res.status(201).json({ success: true, data: created });
  }));

  app.get("/api/production/orders", asyncHandler((req, res) => {
    res.json(db.getProductionOrders());
  }));

  app.post("/api/production/orders", asyncHandler((req, res) => {
    const created = db.createProductionOrder(req.body, "admin@empresa.com");
    res.status(201).json({ success: true, data: created });
  }));

  app.put("/api/production/orders/:id", asyncHandler((req, res) => {
    const { status } = req.body;
    const po = db.updateProductionOrder(req.params.id, status, "admin@empresa.com");
    res.json({ success: true, data: po });
  }));

  // Security and Audits access
  app.get("/api/audit", asyncHandler((req, res) => {
    res.json(db.getAuditLogs());
  }));

  // Clear system log entry point (For administration)
  app.post("/api/audit/log-external", asyncHandler((req, res) => {
    const { action, module, details } = req.body;
    db.logAudit(action, module, details, "admin@empresa.com");
    res.json({ success: true });
  }));


  // ==========================================
  // VITE FRONTEND MIDDLEWARE SETUP
  // ==========================================

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production serving precompiled assets from dist
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[ERP AGENT SERVER] Server running on http://localhost:${PORT}`);
  });
}

startServer();
