/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

// Import modules
import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import WarehousesPage from "./pages/WarehousesPage";
import MovementsPage from "./pages/MovementsPage";
import BusinessRelationsPage from "./pages/BusinessRelationsPage";
import OrdersPage from "./pages/OrdersPage";
import ProductionPage from "./pages/ProductionPage";
import ReportsPage from "./pages/ReportsPage";
import AuditPage from "./pages/AuditPage";
import SettingsPage from "./pages/SettingsPage";

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
  AuditLog 
} from "./types";

export default function App() {
  const [activePage, setActivePage] = useState<string>("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Dynamic state records
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [formulas, setFormulas] = useState<ProductionFormula[]>([]);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // System parameters
  const [companyName, setCompanyName] = useState("GRUPO FARMACÉUTICO LATINOAMÉRICA S.A.");
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [taxRate, setTaxRate] = useState(0.19); // 19% IVA

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDeleteProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchAllData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Synchronous refresh cycle of all datasets
  const fetchAllData = async () => {
    try {
      const pRes = await fetch("/api/products");
      const wRes = await fetch("/api/warehouses");
      const mRes = await fetch("/api/movements");
      const provRes = await fetch("/api/relations/providers");
      const custRes = await fetch("/api/relations/customers");
      const poRes = await fetch("/api/orders/purchases");
      const soRes = await fetch("/api/orders/sales");
      const fRes = await fetch("/api/production/formulas");
      const pOrderRes = await fetch("/api/production/orders");
      const logRes = await fetch("/api/audit");
      const settingsRes = await fetch("/api/settings");

      if (pRes.ok) setProducts(await pRes.json());
      if (wRes.ok) setWarehouses(await wRes.json());
      if (mRes.ok) setMovements(await mRes.json());
      if (provRes.ok) setProviders(await provRes.json());
      if (custRes.ok) setCustomers(await custRes.json());
      if (poRes.ok) setPurchaseOrders(await poRes.json());
      if (soRes.ok) setSalesOrders(await soRes.json());
      if (fRes.ok) setFormulas(await fRes.json());
      if (pOrderRes.ok) setProductionOrders(await pOrderRes.json());
      if (logRes.ok) setAuditLogs(await logRes.json());
      
      if (settingsRes.ok) {
        const setJson = await settingsRes.json();
        setCompanyName(setJson.companyName || "GRUPO FARMACÉUTICO S.A.");
        setCurrencySymbol(setJson.currencySymbol || "$");
        setTaxRate(setJson.taxRate !== undefined ? setJson.taxRate : 0.19);
      }

      setErrorMsg(null);
    } catch (e: any) {
      setErrorMsg("Ocurrió un error de conexión al sincronizar con el backend.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Post Mutators
  const saveSettingsToAPI = async (name: string, symbol: string, rate: number) => {
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: name, currencySymbol: symbol, taxRate: rate })
      });
      return res.ok;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleAddProduct = async (prodData: any) => {
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prodData)
      });
      if (res.ok) {
        fetchAllData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleEditProduct = async (id: string, updates: any) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        fetchAllData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleAddAdjustment = async (adjData: any) => {
    try {
      const res = await fetch("/api/products/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adjData)
      });
      if (res.ok) {
        fetchAllData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleAddWarehouse = async (whData: any) => {
    try {
      const res = await fetch("/api/warehouses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(whData)
      });
      if (res.ok) {
        fetchAllData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleTransferInventory = async (transferData: any) => {
    try {
      const res = await fetch("/api/warehouses/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transferData)
      });
      if (res.ok) {
        fetchAllData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleAddProvider = async (pData: any) => {
    try {
      const res = await fetch("/api/relations/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pData)
      });
      if (res.ok) {
        fetchAllData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleEditProvider = async (id: string, updates: any) => {
    try {
      const res = await fetch(`/api/relations/providers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        fetchAllData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleAddCustomer = async (cData: any) => {
    try {
      const res = await fetch("/api/relations/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cData)
      });
      if (res.ok) {
        fetchAllData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleEditCustomer = async (id: string, updates: any) => {
    try {
      const res = await fetch(`/api/relations/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        fetchAllData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleAddPurchaseOrder = async (poData: any) => {
    try {
      const res = await fetch("/api/orders/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(poData)
      });
      if (res.ok) {
        fetchAllData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleEditPurchaseOrder = async (id: string, updates: any) => {
    try {
      const res = await fetch(`/api/orders/purchases/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        fetchAllData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleAddSalesOrder = async (soData: any) => {
    try {
      const res = await fetch("/api/orders/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(soData)
      });
      if (res.ok) {
        fetchAllData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleEditSalesOrder = async (id: string, updates: any) => {
    try {
      const res = await fetch(`/api/orders/sales/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        fetchAllData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleAddFormula = async (fData: any) => {
    try {
      const res = await fetch("/api/production/formulas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fData)
      });
      if (res.ok) {
        fetchAllData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleAddProductionOrder = async (pOrderData: any) => {
    try {
      const res = await fetch("/api/production/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pOrderData)
      });
      if (res.ok) {
        fetchAllData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleEditProductionStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/production/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchAllData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Render specific module based on active side navigation focus
  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return (
          <DashboardPage 
            products={products} 
            movements={movements} 
            config={{
              companyName,
              currency: "COP",
              currencySymbol,
              taxRate,
              alertMinStock: true,
              alertExpiryDays: 30
            }} 
            onPageChange={setActivePage} 
          />
        );
      case "products":
        return (
          <ProductsPage 
            products={products} 
            warehouses={warehouses} 
            currencySymbol={currencySymbol}
            onAddProduct={handleAddProduct} 
            onEditProduct={handleEditProduct} 
            onDeleteProduct={handleDeleteProduct}
            onRegisterMovement={handleAddAdjustment} 
            onRefresh={fetchAllData} 
          />
        );
      case "warehouses":
        return <WarehousesPage warehouses={warehouses} products={products} onAddWarehouse={handleAddWarehouse} onTransferInventory={handleTransferInventory} onRefresh={fetchAllData} />;
      case "movements":
        return <MovementsPage movements={movements} currencySymbol={currencySymbol} />;
      case "relations":
        return <BusinessRelationsPage providers={providers} customers={customers} onAddProvider={handleAddProvider} onEditProvider={handleEditProvider} onAddCustomer={handleAddCustomer} onEditCustomer={handleEditCustomer} currencySymbol={currencySymbol} />;
      case "orders":
        return <OrdersPage purchaseOrders={purchaseOrders} salesOrders={salesOrders} providers={providers} customers={customers} products={products} onAddPurchaseOrder={handleAddPurchaseOrder} onEditPurchaseOrder={handleEditPurchaseOrder} onAddSalesOrder={handleAddSalesOrder} onEditSalesOrder={handleEditSalesOrder} currencySymbol={currencySymbol} />;
      case "purchases":
        return <OrdersPage initialTab="purchases" purchaseOrders={purchaseOrders} salesOrders={salesOrders} providers={providers} customers={customers} products={products} onAddPurchaseOrder={handleAddPurchaseOrder} onEditPurchaseOrder={handleEditPurchaseOrder} onAddSalesOrder={handleAddSalesOrder} onEditSalesOrder={handleEditSalesOrder} currencySymbol={currencySymbol} />;
      case "sales":
        return <OrdersPage initialTab="sales" purchaseOrders={purchaseOrders} salesOrders={salesOrders} providers={providers} customers={customers} products={products} onAddPurchaseOrder={handleAddPurchaseOrder} onEditPurchaseOrder={handleEditPurchaseOrder} onAddSalesOrder={handleAddSalesOrder} onEditSalesOrder={handleEditSalesOrder} currencySymbol={currencySymbol} />;
      case "production":
        return <ProductionPage formulas={formulas} productionOrders={productionOrders} products={products} onAddFormula={handleAddFormula} onAddProductionOrder={handleAddProductionOrder} onEditProductionStatus={handleEditProductionStatus} currencySymbol={currencySymbol} />;
      case "reports":
        return <ReportsPage products={products} movements={movements} auditLogs={auditLogs} currencySymbol={currencySymbol} />;
      case "audit":
        return <AuditPage auditLogs={auditLogs} />;
      case "settings":
        return <SettingsPage companyName={companyName} setCompanyName={setCompanyName} currencySymbol={currencySymbol} setCurrencySymbol={setCurrencySymbol} taxRate={taxRate} setTaxRate={setTaxRate} onRefresh={fetchAllData} />;
      default:
        return (
          <DashboardPage 
            products={products} 
            movements={movements} 
            config={{
              companyName,
              currency: "COP",
              currencySymbol,
              taxRate,
              alertMinStock: true,
              alertExpiryDays: 30
            }} 
            onPageChange={setActivePage} 
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center select-none" id="global-loader-wrapper">
        <div className="p-4 bg-indigo-600/10 border border-indigo-500/15 rounded-full mb-3.5 animate-pulse">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">Sincronizando Sistema de Control</h1>
        <p className="text-xs text-slate-400 mt-1 font-medium">Buscando firmas y registros autorizados del ERP...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center" id="global-error-wrapper">
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl mb-4 text-3xl">☣</div>
        <h1 className="text-lg font-bold tracking-tight text-white">Falla de Enlace ERP</h1>
        <p className="text-xs text-rose-400 mt-2 max-w-sm leading-relaxed">{errorMsg}</p>
        <button
          onClick={() => { setLoading(true); fetchAllData(); }}
          className="mt-5 px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
        >
          Re-conectar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-700 flex select-none" id="app-viewport-root">
      {/* Sidebar navigation */}
      <Sidebar 
        currentTab={activePage} 
        setCurrentTab={setActivePage} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
      />

      {/* Main content frame panel */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64">
        {/* Modern interactive top bar */}
        <Header 
          products={products} 
          onRefresh={fetchAllData} 
          isLoading={loading} 
        />

        <main className="flex-grow p-4 md:p-8 max-w-7xl w-full mx-auto pb-24">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

