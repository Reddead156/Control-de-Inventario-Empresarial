/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { PurchaseOrder, SalesOrder, Provider, Customer, Product, OrderItem } from "../types";
import { 
  Plus, 
  Search, 
  Trash2, 
  DollarSign, 
  Clock, 
  ShoppingBag, 
  CheckCircle,
  Truck,
  AlertTriangle,
  X,
  CreditCard,
  UserCheck
} from "lucide-react";

interface OrdersPageProps {
  purchaseOrders: PurchaseOrder[];
  salesOrders: SalesOrder[];
  providers: Provider[];
  customers: Customer[];
  products: Product[];
  currencySymbol: string;
  initialTab?: "purchases" | "sales";
  onAddPurchaseOrder: (po: any) => Promise<boolean>;
  onEditPurchaseOrder: (id: string, updates: any) => Promise<boolean>;
  onAddSalesOrder: (so: any) => Promise<boolean>;
  onEditSalesOrder: (id: string, updates: any) => Promise<boolean>;
}

export default function OrdersPage({
  purchaseOrders,
  salesOrders,
  providers,
  customers,
  products,
  currencySymbol,
  initialTab,
  onAddPurchaseOrder,
  onEditPurchaseOrder,
  onAddSalesOrder,
  onEditSalesOrder
}: OrdersPageProps) {
  const [activeTab, setActiveTab] = useState<"purchases" | "sales">(initialTab || "purchases");

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [searchTerm, setSearchTerm] = useState("");

  // Create Modals toggles
  const [showAddPOModal, setShowAddPOModal] = useState(false);
  const [showAddSOModal, setShowAddSOModal] = useState(false);

  // Dynamic builder lines states
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [notes, setNotes] = useState("");
  const [checkoutItems, setCheckoutItems] = useState<OrderItem[]>([]);
  
  // Single active builder line selection
  const [lineSku, setLineSku] = useState("");
  const [lineQty, setLineQty] = useState(1);
  const [linePrice, setLinePrice] = useState(0);

  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Append new item to the active building basket
  const handleAddLineItem = () => {
    if (!lineSku) return;
    const prod = products.find(p => p.sku === lineSku);
    if (!prod) return;

    // Check duplicate in array
    if (checkoutItems.some(i => i.productSku === lineSku)) {
      showNotification("error", "El producto SKU ya está agregado a las líneas. Modifique la cantidad.");
      return;
    }

    const newItem: OrderItem = {
      productSku: lineSku,
      productName: prod.name,
      quantity: Number(lineQty),
      unitPrice: Number(linePrice),
      total: Number(lineQty * linePrice)
    };

    setCheckoutItems([...checkoutItems, newItem]);
    setLineSku("");
    setLineQty(1);
    setLinePrice(0);
  };

  const handleRemoveLineItem = (sku: string) => {
    setCheckoutItems(checkoutItems.filter(i => i.productSku !== sku));
  };

  const computeBasketTotals = () => {
    const subtotal = checkoutItems.reduce((acc, i) => acc + i.total, 0);
    const taxes = Number((subtotal * 0.19).toFixed(2)); // Standard 19% tax rate
    const totalAmount = subtotal + taxes;
    return { subtotal, taxes, totalAmount };
  };

  // Submit supply purchase order draft
  const handlePOSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartnerId || checkoutItems.length === 0) {
      showNotification("error", "Seleccione un proveedor y agregue al menos una lína de material.");
      return;
    }

    const providerObj = providers.find(p => p.id === selectedPartnerId)!;
    const { subtotal, taxes, totalAmount } = computeBasketTotals();

    const payload = {
      providerId: selectedPartnerId,
      providerName: providerObj.name,
      items: checkoutItems,
      date: new Date().toISOString(),
      subtotal,
      taxes,
      totalAmount,
      notes: notes.trim() || `Abastecimiento general programado de ${providerObj.name}`
    };

    const success = await onAddPurchaseOrder(payload);
    if (success) {
      showNotification("success", "Borrador de Órden de Compra generado en sistema.");
      setShowAddPOModal(false);
      setCheckoutItems([]);
      setSelectedPartnerId("");
      setNotes("");
    } else {
      showNotification("error", "Falla al crear la orden de compra.");
    }
  };

  // Approve and receive PO into warehouse
  const handleApprovePO = async (poId: string) => {
    const invNum = prompt("Ingrese el NÚMERO DE FACTURA física del proveedor para liquidación contable:");
    if (invNum === null) return; // cancelled prompt
    
    const success = await onEditPurchaseOrder(poId, { status: "received", invoiceNumber: invNum || "FC-PROV" });
    if (success) {
      showNotification("success", "Mercancía ingresada al Almacén Central de forma automática con recálculo PPP.");
    } else {
      showNotification("error", "No se pudo recibir e ingresar la mercancía de la orden.");
    }
  };

  // Submit client sales invoice draft
  const handleSOSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartnerId || checkoutItems.length === 0) {
      showNotification("error", "Seleccione un cliente y añada productos al carro.");
      return;
    }

    const customerObj = customers.find(c => c.id === selectedPartnerId)!;
    const { subtotal, taxes, totalAmount } = computeBasketTotals();

    // Check Credit Limit before checkout drafts
    if (customerObj.availableCredit < totalAmount) {
      if (!confirm(`ALERTA DE CREDITO: El cliente '${customerObj.name}' no tiene cupo suficiente (Crédito disponible: ${currencySymbol}${customerObj.availableCredit.toLocaleString()}).\n¿Desea forzar la venta bajo aprobación ejecutiva extraordinaria?`)) {
        return;
      }
    }

    const payload = {
      customerId: selectedPartnerId,
      customerName: customerObj.name,
      items: checkoutItems,
      date: new Date().toISOString(),
      subtotal,
      taxes,
      totalAmount,
      notes: notes.trim() || `Factura de despacho asignada a ${customerObj.name}`
    };

    const success = await onAddSalesOrder(payload);
    if (success) {
      showNotification("success", "Borrador de Factura de Venta guardado en el archivo ledger.");
      setShowAddSOModal(false);
      setCheckoutItems([]);
      setSelectedPartnerId("");
      setNotes("");
    } else {
      showNotification("error", "Sucedió un error al registrar el borrador.");
    }
  };

  // Approve and dispatch sales order
  const handleDispatchSO = async (soId: string) => {
    if (!confirm("¿Autorizar el despacho físico de mercancía?\nEsto deducirá stocks del almacén central.")) return;
    
    const courier = prompt("Ingrese la EMPRESA TRANSPORTADORA o patente asignada al despacho:", "Transportes Logísticos Express");
    if (courier === null) return;

    const success = await onEditSalesOrder(soId, { status: "shipped", deliveredBy: courier || "Propio" });
    if (success) {
      showNotification("success", "Mercancías despachadas con éxito. Stock deducido y balance de cliente debitado.");
    } else {
      showNotification("error", "ERROR DE DISPACHEO: No hay stock suficiente en Almacén Central para despachar esta órden.");
    }
  };

  const filteredPurchases = purchaseOrders.filter(p => 
    p.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.providerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSales = salesOrders.filter(s => 
    s.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6" id="orders-billing-page">
      {/* Upper header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Facturación & Órdenes Logísticas</h2>
          <p className="text-sm text-slate-500 mt-0.5">Control contable de facturas de proveedores, despachos a clientes y pre-aprobaciones financieras.</p>
        </div>

        <button
          onClick={() => {
            setCheckoutItems([]);
            if (activeTab === "purchases") {
              setSelectedPartnerId("");
              setShowAddPOModal(true);
            } else {
              setSelectedPartnerId("");
              setShowAddSOModal(true);
            }
          }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl cursor-pointer shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          {activeTab === "purchases" ? "Nueva Órden de Compra" : "Nuevo Despacho de Venta"}
        </button>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-3.5 border animate-fade-in ${
          notification.type === "success" 
            ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
            : "bg-rose-50 text-rose-800 border-rose-200"
        }`}>
          <AlertTriangle className={`w-4 h-4 ${notification.type === "success" ? "text-emerald-600" : "text-rose-600"}`} />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex border-b border-gray-100 gap-4">
        <button
          onClick={() => { setActiveTab("purchases"); setSearchTerm(""); }}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "purchases" ? "border-indigo-600 text-indigo-600 font-black" : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Ordenes de Compra (Abastecimiento)
        </button>
        <button
          onClick={() => { setActiveTab("sales"); setSearchTerm(""); }}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "sales" ? "border-indigo-600 text-indigo-600 font-black" : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Facturas de Ventas (Despacho)
        </button>
      </div>

      {/* Filtering */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
        <input
          type="text"
          placeholder={`Buscar órdenes por código (OC/OV) u razón fiscal de socios...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm"
        />
      </div>

      {/* Tables representation */}
      {activeTab === "purchases" ? (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden" id="purchases-ledgers-table">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[10px] text-gray-500 uppercase tracking-wider font-extrabold border-b border-gray-100">
                <th className="py-3 px-6">Código OC</th>
                <th>Socio Suministrador</th>
                <th>Fecha Emisión</th>
                <th>Líneas Items</th>
                <th>Subtotal</th>
                <th>Impuestos (19%)</th>
                <th>Monto Neto</th>
                <th>Estatus Financiero</th>
                <th className="text-center py-3 px-6">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-medium">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">No se registran órdenes de compra s/ parámetros en sistema.</td>
                </tr>
              ) : (
                filteredPurchases.map((po) => (
                  <tr key={po.id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="py-4 px-6 font-mono font-extrabold text-indigo-600">{po.orderNumber}</td>
                    <td className="font-bold text-gray-800">{po.providerName}</td>
                    <td className="text-slate-400 font-mono">{new Date(po.date).toLocaleDateString("es-ES")}</td>
                    <td>
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                        {po.items.length} SKUs
                      </span>
                    </td>
                    <td className="font-mono text-gray-500">{currencySymbol}{po.subtotal.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                    <td className="font-mono text-gray-500">{currencySymbol}{po.taxes.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                    <td className="font-mono font-black text-slate-800">{currencySymbol}{po.totalAmount.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                    <td>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        po.status === "received" 
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-100" 
                          : po.status === "sent"
                            ? "bg-blue-50 text-blue-700 border border-blue-100 animate-pulse"
                            : "bg-gray-100 text-gray-500"
                      }`}>
                        {po.status === "received" ? "ENTREGADA & LIQUIDADA" : po.status === "sent" ? "EN TRÁNSITO / SOLICITADA" : "BORRADOR"}
                      </span>
                      {po.invoiceNumber && (
                        <span className="block text-[9px] text-slate-400 font-mono mt-1">Fac: {po.invoiceNumber}</span>
                      )}
                    </td>
                    <td className="text-center py-4 px-6">
                      {po.status !== "received" && (
                        <button
                          onClick={() => handleApprovePO(po.id)}
                          className="px-2.5 py-1 text-[10px] bg-emerald-550 hover:bg-emerald-650 text-white font-extrabold rounded-md cursor-pointer flex items-center gap-1 mx-auto shadow-sm"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Liquidar Ingreso</span>
                        </button>
                      )}
                      {po.status === "received" && (
                        <span className="text-emerald-600 font-bold block text-center text-[10px]">✔ Trazado</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden" id="sales-ledgers-table">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[10px] text-gray-500 uppercase tracking-wider font-extrabold border-b border-gray-100">
                <th className="py-3 px-6">Código OV</th>
                <th>Cliente Cuenta Clave</th>
                <th>Fecha Emisión</th>
                <th>Líneas Items</th>
                <th>Subtotal</th>
                <th>Impuestos (19%)</th>
                <th>Monto Neto</th>
                <th>Estatus Logístico</th>
                <th className="text-center py-3 px-6">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-medium">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">No se registran despatcheos de ventas en el sistema.</td>
                </tr>
              ) : (
                filteredSales.map((so) => {
                  const isDone = so.status === "shipped" || so.status === "delivered";
                  return (
                    <tr key={so.id} className="hover:bg-gray-50/40 transition-colors">
                      <td className="py-4 px-6 font-mono font-extrabold text-violet-600">{so.orderNumber}</td>
                      <td className="font-black text-gray-800">{so.customerName}</td>
                      <td className="text-slate-400 font-mono">{new Date(so.date).toLocaleDateString("es-ES")}</td>
                      <td>
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                          {so.items.length} SKUs
                        </span>
                      </td>
                      <td className="font-mono text-gray-500">{currencySymbol}{so.subtotal.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                      <td className="font-mono text-gray-500">{currencySymbol}{so.taxes.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                      <td className="font-mono font-black text-slate-800">{currencySymbol}{so.totalAmount.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</td>
                      <td>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          isDone 
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-100" 
                            : "bg-amber-50 text-amber-700 border border-amber-100"
                        }`}>
                          {isDone ? "DESPACHADA & CLIENTE C/ DEUDA" : "BORRADOR EN CONTROL"}
                        </span>
                        {so.deliveredBy && (
                          <span className="block text-[9px] text-slate-400 font-mono mt-1">Trans: {so.deliveredBy}</span>
                        )}
                      </td>
                      <td className="text-center py-4 px-6">
                        {!isDone && (
                          <button
                            onClick={() => handleDispatchSO(so.id)}
                            className="px-2.5 py-1 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-md cursor pointer flex items-center gap-1 mx-auto shadow-sm"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Autorizar Despacho</span>
                          </button>
                        )}
                        {isDone && (
                          <span className="text-indigo-650 font-bold block text-center text-[10px]">✈ Despachado</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}


      {/* MODAL: REGISTRAR ORDEN DE COMPRA (DRAFT) */}
      {showAddPOModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in" id="add-purchase-order-modal">
          <div className="bg-white rounded-2xl border border-gray-100 w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <span className="font-bold text-gray-800 text-sm">Crear Órden de Abastecimiento de Compra</span>
              <button onClick={() => setShowAddPOModal(false)} className="p-1.5 hover:bg-gray-200 rounded-lg cursor-pointer"><X className="w-4.5 h-4.5" /></button>
            </div>
            <form onSubmit={handlePOSubmit} className="p-6 space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-500 uppercase mb-1">Socio Suministrador (Proveedor) *</label>
                  <select
                    required
                    value={selectedPartnerId}
                    onChange={(e) => setSelectedPartnerId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="">--Seleccionar Proveedor--</option>
                    {providers.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (RUT: {p.taxId})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-500 uppercase mb-1">Notas contables de arribo</label>
                  <input
                    type="text"
                    placeholder="E.g., Convenio de pago 30 días neto."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Dynamic lines list editor */}
              <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 space-y-3">
                <h4 className="font-extrabold text-gray-700 text-xs border-b border-gray-200/50 pb-2">Lineas de Compra (Materiales)</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div className="md:col-span-1">
                    <label className="block text-[10px] text-gray-500 uppercase mb-1">Materia Prima Catalogada *</label>
                    <select
                      value={lineSku}
                      onChange={(e) => {
                        const sku = e.target.value;
                        setLineSku(sku);
                        const prod = products.find(p => p.sku === sku);
                        if (prod) setLinePrice(prod.avgCost);
                      }}
                      className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="">--Seleccione Material--</option>
                      {products.filter(p => p.status === "active").map(p => (
                        <option key={p.id} value={p.sku}>{p.sku} - {p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase mb-1">Cantidad de Compra *</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Cantidad"
                      value={lineQty || ""}
                      onChange={(e) => setLineQty(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-[10px] text-gray-500 uppercase mb-1">Costo Unitario pactado ({currencySymbol}) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Precio Unitario"
                        value={linePrice || ""}
                        onChange={(e) => setLinePrice(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddLineItem}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold p-2 px-3 rounded-lg cursor-pointer transition-colors border shadow-sm"
                    >
                      Añadir
                    </button>
                  </div>
                </div>

                {/* Lines Review deck */}
                <div className="max-h-40 overflow-y-auto divide-y divide-gray-150 border border-gray-200 rounded-lg bg-white">
                  {checkoutItems.length === 0 ? (
                    <div className="p-4 text-center text-gray-400 font-normal">Añada productos utilizando los cargadores de arriba.</div>
                  ) : (
                    checkoutItems.map((item) => (
                      <div key={item.productSku} className="p-2.5 flex items-center justify-between hover:bg-gray-50">
                        <div className="min-w-0 pr-2">
                          <span className="font-extrabold text-slate-800 block text-xs">{item.productName}</span>
                          <span className="text-[9px] text-slate-400 font-mono">SKU ID: {item.productSku}</span>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0 text-right font-mono">
                          <div>
                            <span className="text-slate-700 block text-xs font-bold">x{item.quantity}</span>
                            <span className="text-[9px] text-slate-400">{currencySymbol}{item.unitPrice.toFixed(2)} c/u</span>
                          </div>
                          <span className="font-extrabold text-slate-800 w-20">{currencySymbol}{item.total.toFixed(2)}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(item.productSku)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Billing Summary calculation */}
                {checkoutItems.length > 0 && (
                  <div className="bg-white rounded-lg p-3 border border-gray-250/55 flex justify-between font-mono text-slate-800 text-right animate-fade-in text-[11px]">
                    <div className="space-y-1 text-slate-400 font-sans">
                      <span>Subtotal:</span>
                      <br />
                      <span>IVA (IVA 19%):</span>
                      <br />
                      <strong className="text-indigo-650">Total Órden:</strong>
                    </div>
                    <div className="space-y-1 font-bold">
                      <span>{currencySymbol}{computeBasketTotals().subtotal.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
                      <br />
                      <span>{currencySymbol}{computeBasketTotals().taxes.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
                      <br />
                      <strong className="text-indigo-650">{currencySymbol}{computeBasketTotals().totalAmount.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</strong>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddPOModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={checkoutItems.length === 0}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-lg cursor-pointer transition-colors shadow-md shadow-indigo-600/10"
                >
                  Registrar Órden (Borrador)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* MODAL: REGISTRAR ORDEN DE VENTA / DESPACHO */}
      {showAddSOModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in" id="add-sales-order-modal">
          <div className="bg-white rounded-2xl border border-gray-100 w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <span className="font-bold text-gray-800 text-sm">Crear Órden de Venta s/ Factura</span>
              <button onClick={() => setShowAddSOModal(false)} className="p-1.5 hover:bg-gray-200 rounded-lg cursor-pointer"><X className="w-4.5 h-4.5" /></button>
            </div>
            <form onSubmit={handleSOSubmit} className="p-6 space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-500 uppercase mb-1">Cliente Canal de Facturación *</label>
                  <select
                    required
                    value={selectedPartnerId}
                    onChange={(e) => setSelectedPartnerId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="">--Seleccionar Cliente--</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} (RUT: {c.taxId})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-500 uppercase mb-1">Dirección de Despacho / Observación</label>
                  <input
                    type="text"
                    placeholder="E.g., Despacho puerta a puerta vía transportes Alfa."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Dynamic lines list editor */}
              <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 space-y-3">
                <h4 className="font-extrabold text-gray-700 text-xs border-b border-gray-200/50 pb-2">Líneas de Venta (Productos Despachados)</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div className="md:col-span-1">
                    <label className="block text-[10px] text-gray-500 uppercase mb-1">Producto Terminado o Insumo *</label>
                    <select
                      value={lineSku}
                      onChange={(e) => {
                        const sku = e.target.value;
                        setLineSku(sku);
                        const prod = products.find(p => p.sku === sku);
                        if (prod) setLinePrice(prod.price);
                      }}
                      className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="">--Seleccione Item--</option>
                      {products.filter(p => p.status === "active").map(p => (
                        <option key={p.id} value={p.sku}>{p.sku} - {p.name} (Disp: {p.currentStock})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase mb-1">Cantidad a Vender *</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Cantidad"
                      value={lineQty || ""}
                      onChange={(e) => setLineQty(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-[10px] text-gray-500 uppercase mb-1">Precio Unitario Convenido ({currencySymbol}) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Precio Unitario"
                        value={linePrice || ""}
                        onChange={(e) => setLinePrice(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddLineItem}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold p-2 px-3 rounded-lg cursor-pointer transition-colors border shadow-sm"
                    >
                      Añadir
                    </button>
                  </div>
                </div>

                {/* Lines Review deck */}
                <div className="max-h-40 overflow-y-auto divide-y divide-gray-150 border border-gray-200 rounded-lg bg-white">
                  {checkoutItems.length === 0 ? (
                    <div className="p-4 text-center text-gray-400 font-normal">No hay líneas cargadas aún. Use los formularios de arriba.</div>
                  ) : (
                    checkoutItems.map((item) => (
                      <div key={item.productSku} className="p-2.5 flex items-center justify-between hover:bg-gray-50">
                        <div className="min-w-0 pr-2">
                          <span className="font-extrabold text-slate-800 block text-xs">{item.productName}</span>
                          <span className="text-[9px] text-slate-400 font-mono">SKU ID: {item.productSku}</span>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0 text-right font-mono">
                          <div>
                            <span className="text-slate-700 block text-xs font-bold">x{item.quantity}</span>
                            <span className="text-[9px] text-slate-400">{currencySymbol}{item.unitPrice.toFixed(2)} c/u</span>
                          </div>
                          <span className="font-extrabold text-slate-800 w-20">{currencySymbol}{item.total.toFixed(2)}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(item.productSku)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer animate-fade-in"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Billing Summary calculation */}
                {checkoutItems.length > 0 && (
                  <div className="bg-white rounded-lg p-3 border border-gray-250/55 flex justify-between font-mono text-slate-800 text-right animate-fade-in text-[11px]">
                    <div className="space-y-1 text-slate-400 font-sans">
                      <span>Subtotal:</span>
                      <br />
                      <span>Impuesto (19% S/ IVA):</span>
                      <br />
                      <strong className="text-violet-600">Total Factura:</strong>
                    </div>
                    <div className="space-y-1 font-bold">
                      <span>{currencySymbol}{computeBasketTotals().subtotal.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
                      <br />
                      <span>{currencySymbol}{computeBasketTotals().taxes.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</span>
                      <br />
                      <strong className="text-violet-600">{currencySymbol}{computeBasketTotals().totalAmount.toLocaleString("es-ES", { minimumFractionDigits: 2 })}</strong>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddSOModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={checkoutItems.length === 0}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-lg cursor-pointer transition-colors shadow-md shadow-indigo-600/10"
                >
                  Registrar Despacho (Borrador)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

