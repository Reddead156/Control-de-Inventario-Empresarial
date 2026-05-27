/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Product, Warehouse, Batch, MovementType, MovementSubType } from "../types";
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit, 
  Layers, 
  Boxes, 
  AlertCircle, 
  Filter, 
  Eye, 
  X, 
  History,
  CheckCircle,
  Database
} from "lucide-react";

interface ProductsPageProps {
  products: Product[];
  warehouses: Warehouse[];
  currencySymbol: string;
  onAddProduct: (prod: any) => Promise<boolean>;
  onEditProduct: (id: string, updates: any) => Promise<boolean>;
  onDeleteProduct: (id: string) => Promise<boolean>;
  onRegisterMovement: (mov: any) => Promise<boolean>;
  onRefresh: () => void;
}

export default function ProductsPage({
  products,
  warehouses,
  currencySymbol,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onRegisterMovement,
  onRefresh
}: ProductsPageProps) {
  // Filters & State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
  const [selectedStockState, setSelectedStockState] = useState("all"); // "all", "low", "out", "active"

  // Modal Controls
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLotsModal, setShowLotsModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);

  // Focus Objects
  const [focusedProduct, setFocusedProduct] = useState<Product | null>(null);

  // Form states (Add)
  const [formSku, setFormSku] = useState("");
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCat, setFormCat] = useState("Materias Primas");
  const [formSubcat, setFormSubcat] = useState("");
  const [formUom, setFormUom] = useState("unidades");
  const [formMinStock, setFormMinStock] = useState(10);
  const [formMaxStock, setFormMaxStock] = useState(1000);
  const [formCost, setFormCost] = useState(1.0);
  const [formPrice, setFormPrice] = useState(2.0);
  const [formInitialStock, setFormInitialStock] = useState(0);

  // Form states (Adjustment)
  const [adjType, setAdjType] = useState<MovementType>("entry");
  const [adjSubtype, setAdjSubtype] = useState<MovementSubType>("initial");
  const [adjWarehouse, setAdjWarehouse] = useState("");
  const [adjQuantity, setAdjQuantity] = useState(0);
  const [adjLot, setAdjLot] = useState("");
  const [adjNotes, setAdjNotes] = useState("");

  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const categories = Array.from(new Set(products.map(p => p.category)));

  // Helper trigger alerts
  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Perform filtering
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.sku.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    
    const matchesWarehouse = selectedWarehouse === "all" || (p.warehouseStock[selectedWarehouse] || 0) > 0;
    
    let matchesStock = true;
    if (selectedStockState === "low") {
      matchesStock = p.currentStock <= p.minStock;
    } else if (selectedStockState === "out") {
      matchesStock = p.currentStock <= 0;
    } else if (selectedStockState === "active") {
      matchesStock = p.status === "active";
    }

    return matchesSearch && matchesCategory && matchesWarehouse && matchesStock;
  });

  // Handle Create Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSku.trim() || !formName.trim()) {
      showNotification("error", "El SKU y el Nombre son requeridos obligatoriamente.");
      return;
    }

    // Prepare warehouse allocations for the initial stock
    const whSelection = warehouses[0]?.id || "alm-1";
    const initialAllocation: Record<string, number> = {};
    if (formInitialStock > 0) {
      initialAllocation[whSelection] = formInitialStock;
    }

    const newProd = {
      sku: formSku.toUpperCase().trim(),
      name: formName.trim(),
      description: formDesc.trim(),
      category: formCat,
      subcategory: formSubcat.trim() || "Otros",
      unitOfMeasure: formUom,
      minStock: Number(formMinStock) || 0,
      maxStock: Number(formMaxStock) || 1,
      avgCost: Number(formCost) || 0,
      price: Number(formPrice) || 0,
      currentStock: Number(formInitialStock) || 0,
      batches: [],
      serialNumbers: [],
      warehouseStock: initialAllocation,
      status: "active" as const
    };

    const success = await onAddProduct(newProd);
    if (success) {
      showNotification("success", `Producto SKU '${newProd.sku}' creado con éxito.`);
      setShowAddModal(false);
      // reset states
      setFormSku("");
      setFormName("");
      setFormDesc("");
      setFormSubcat("");
      setFormInitialStock(0);
    } else {
      showNotification("error", "Error del servidor. Es posible que el SKU ya exista en catálogo.");
    }
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!focusedProduct) return;

    const updates = {
      name: formName.trim(),
      description: formDesc.trim(),
      category: formCat,
      subcategory: formSubcat.trim() || "Otros",
      unitOfMeasure: formUom,
      minStock: Number(formMinStock) || 0,
      maxStock: Number(formMaxStock) || 1,
      avgCost: Number(formCost) || 0,
      price: Number(formPrice) || 0,
    };

    const success = await onEditProduct(focusedProduct.id, updates);
    if (success) {
      showNotification("success", "Parámetros de producto modificados exitosamente.");
      setShowEditModal(false);
    } else {
      showNotification("error", "No se pudo actualizar el producto.");
    }
  };

  // Handle Delete Click
  const handleDeleteClick = async (p: Product) => {
    if (confirm(`¿Está completamente seguro de dar de BAJA al producto SKU: ${p.sku} (${p.name})?\nEsta acción quedará auditada.`)) {
      const success = await onDeleteProduct(p.id);
      if (success) {
        showNotification("success", "Producto dado de baja correctamente.");
      } else {
        showNotification("error", "Error al eliminar producto.");
      }
    }
  };

  // Handle Stock adjustment form submit
  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!focusedProduct) return;
    if (!adjWarehouse) {
      showNotification("error", "Seleccione un almacén para el ajuste.");
      return;
    }
    if (adjQuantity <= 0) {
      showNotification("error", "La cantidad de ajuste debe ser mayor que cero.");
      return;
    }

    const selectedWhObj = warehouses.find(w => w.id === adjWarehouse)!;

    const movementObj = {
      type: adjType,
      subType: adjSubtype,
      productSku: focusedProduct.sku,
      productName: focusedProduct.name,
      quantity: Number(adjQuantity),
      warehouseId: adjWarehouse,
      warehouseName: selectedWhObj.name,
      batchNumber: adjLot.trim() || undefined,
      notes: adjNotes.trim() || `Ajuste manual de stock por bodega ${selectedWhObj.name}`
    };

    const success = await onRegisterMovement(movementObj);
    if (success) {
      showNotification("success", "Movimiento de stock registrado y recalculado en ledger.");
      setShowAdjustModal(false);
      setAdjQuantity(0);
      setAdjLot("");
      setAdjNotes("");
    } else {
      showNotification("error", "No se pudo registrar el ajuste. Revise la disponibilidad de stock o lotes.");
    }
  };

  const openEditModal = (p: Product) => {
    setFocusedProduct(p);
    setFormSku(p.sku);
    setFormName(p.name);
    setFormDesc(p.description);
    setFormCat(p.category);
    setFormSubcat(p.subcategory);
    setFormUom(p.unitOfMeasure);
    setFormMinStock(p.minStock);
    setFormMaxStock(p.maxStock);
    setFormCost(p.avgCost);
    setFormPrice(p.price);
    setShowEditModal(true);
  };

  const openAdjustModal = (p: Product) => {
    setFocusedProduct(p);
    setAdjWarehouse(warehouses[0]?.id || "");
    setAdjType("entry");
    setAdjSubtype("reconciliation");
    setShowAdjustModal(true);
  };

  return (
    <div className="space-y-6" id="products-page-container">
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Catálogo de Productos Industriales</h2>
          <p className="text-sm text-slate-500 mt-0.5">Gestión de SKUs, control de costos del PPP y trazabilidad de lotes.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl cursor-pointer shadow-md shadow-indigo-600/10 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Registrar Nuevo SKU
        </button>
      </div>

      {/* Live notification drawer banner */}
      {notification && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-3.5 border animate-fade-in ${
          notification.type === "success" 
            ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
            : "bg-rose-50 text-rose-800 border-rose-200"
        }`}>
          <AlertCircle className={`w-4 h-4 ${notification.type === "success" ? "text-emerald-600" : "text-rose-600"}`} />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Index Filter panel */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3.5">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Text Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar SKU, nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
            />
          </div>

          {/* Category Dropdown */}
          <div className="relative w-full md:w-52">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-3.5 pr-8 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 appearance-none cursor-pointer"
            >
              <option value="all">Todas las Categorías</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Warehouse Dropdown */}
          <div className="relative w-full md:w-52">
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="w-full pl-3.5 pr-8 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 appearance-none cursor-pointer"
            >
              <option value="all">Todos los Almacenes</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Stock Deficit Dropdown */}
          <div className="relative w-full md:w-48">
            <select
              value={selectedStockState}
              onChange={(e) => setSelectedStockState(e.target.value)}
              className="w-full pl-3.5 pr-8 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 appearance-none cursor-pointer"
            >
              <option value="all">Cualquier Alerta</option>
              <option value="low">Stock Bajo Mínimo</option>
              <option value="out">Sin Existencias (Cero)</option>
              <option value="active">Activos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Core Products Data Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="products-catalogue-table">
            <thead>
              <tr className="bg-gray-50 text-[10px] text-gray-500 uppercase tracking-wider font-extrabold border-b border-gray-100">
                <th className="py-3 px-6">SKU Interno</th>
                <th>Nombre del Producto</th>
                <th>Clasificación</th>
                <th>Stock Actual</th>
                <th>Costo Promedio (PPP)</th>
                <th>Precio Público</th>
                <th>Valor Total</th>
                <th>Estatus</th>
                <th className="text-center py-3 px-6">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-medium">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    <Database className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    <p className="font-semibold text-gray-600 text-sm">No se encontraron productos</p>
                    <span className="text-[10px] text-gray-400">Use otros parámetros o registre un nuevo SKU.</span>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.currentStock <= p.minStock;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/40 transition-colors">
                      <td className="py-4 px-6 font-mono font-extrabold text-indigo-600 tracking-tight">{p.sku}</td>
                      <td>
                        <span className="font-bold text-gray-800 block text-xs" title={p.name}>{p.name}</span>
                        <span className="text-[10px] text-gray-400 truncate max-w-xs block font-normal">{p.description}</span>
                      </td>
                      <td>
                        <span className="text-gray-600 block">{p.category}</span>
                        <span className="text-[9px] text-gray-400 uppercase font-mono">{p.subcategory}</span>
                      </td>
                      <td>
                        <span className={`font-bold font-mono text-xs ${isLow ? "text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100" : "text-slate-800"}`}>
                          {p.currentStock} {p.unitOfMeasure}
                        </span>
                        {isLow && p.status === "active" && (
                          <span className="block text-[8px] text-rose-500 mt-1 uppercase font-bold tracking-wider animate-pulse">Requerido Mín: {p.minStock}</span>
                        )}
                      </td>
                      <td className="font-mono text-slate-600">
                        {currencySymbol}{p.avgCost.toFixed(2)}
                      </td>
                      <td className="font-mono font-bold text-indigo-700">
                        {currencySymbol}{p.price.toFixed(2)}
                      </td>
                      <td className="font-mono font-bold text-slate-800">
                        {currencySymbol}{(p.currentStock * p.avgCost).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          p.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-gray-100 text-gray-500"
                        }`}>
                          {p.status === "active" ? "ALTA" : "BAJA"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {p.batches.length > 0 && (
                            <button
                              onClick={() => { setFocusedProduct(p); setShowLotsModal(true); }}
                              className="p-1 px-2 border border-blue-200 text-blue-600 bg-blue-50/50 hover:bg-blue-100/60 rounded flex items-center gap-1 cursor-pointer transition-colors font-semibold shadow-sm"
                              title="Detalle de Lotes"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{p.batches.length} Lotes</span>
                            </button>
                          )}
                          <button
                            onClick={() => openAdjustModal(p)}
                            className="p-1.5 border border-amber-200 text-amber-700 bg-amber-50/50 hover:bg-amber-100 rounded cursor-pointer transition-all"
                            title="Ajuste Rápido de Stock"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 border border-gray-200 text-gray-600 hover:text-gray-950 hover:bg-gray-50 rounded cursor-pointer transition-all"
                            title="Editar SKU"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(p)}
                            className="p-1.5 border border-rose-150 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer transition-all"
                            title="Dar de baja SKU"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* MODAL: REGISTRAR NUEVO SKU */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in" id="add-product-modal">
          <div className="bg-white rounded-2xl border border-gray-100 w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <span className="font-bold text-gray-800 text-sm">Registrar Nuevo SKU en Catálogo</span>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-gray-200 rounded-lg cursor-pointer"><X className="w-4.5 h-4.5" /></button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">SKU Código Interno (Trazabilidad) *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., PROD-ALM-100"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Técnico o Comercial *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Gel Antibacterial Premium 1L"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción de Formulación o Lote</label>
                  <textarea
                    placeholder="Detalle técnico de envasado, almacenamiento, etc."
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoría Principal *</label>
                  <select
                    value={formCat}
                    onChange={(e) => setFormCat(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Materias Primas">Materias Primas</option>
                    <option value="Embalajes">Embalajes</option>
                    <option value="Infraestructura">Infraestructura</option>
                    <option value="Producto Terminado">Producto Terminado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subcategoría *</label>
                  <input
                    type="text"
                    placeholder="E.g., Químicos Líquidos"
                    value={formSubcat}
                    onChange={(e) => setFormSubcat(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Unidad de Medida *</label>
                  <select
                    value={formUom}
                    onChange={(e) => setFormUom(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="unidades">Unidades (pz)</option>
                    <option value="litros">Litros (L)</option>
                    <option value="kg">Kilogramos (Kg)</option>
                    <option value="m">Metros (m)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cantidad Inicial Inventario (Carga)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Módulo de apertura de stock"
                    value={formInitialStock}
                    onChange={(e) => setFormInitialStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Stock Mínimo (Alerta)</label>
                  <input
                    type="number"
                    min="0"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Stock Máximo (Capacidad)</label>
                  <input
                    type="number"
                    min="1"
                    value={formMaxStock}
                    onChange={(e) => setFormMaxStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Costo Unitario Inicial ({currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formCost}
                    onChange={(e) => setFormCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Precio de Venta Sugerido ({currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3.5 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg text-xs cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs cursor-pointer transition-colors shadow-md shadow-indigo-600/10"
                >
                  Confirmar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR PARÁMETROS SKU */}
      {showEditModal && focusedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in" id="edit-product-modal">
          <div className="bg-white rounded-2xl border border-gray-100 w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <span className="font-bold text-gray-800 text-sm">Editar Parámetros - SKU: {focusedProduct.sku}</span>
              <button onClick={() => setShowEditModal(false)} className="p-1.5 hover:bg-gray-200 rounded-lg cursor-pointer"><X className="w-4.5 h-4.5" /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Técnico o Comercial *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción de Formulación o Lote</label>
                  <textarea
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none font-normal"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoría Principal *</label>
                  <select
                    value={formCat}
                    onChange={(e) => setFormCat(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Materias Primas">Materias Primas</option>
                    <option value="Embalajes">Embalajes</option>
                    <option value="Infraestructura">Infraestructura</option>
                    <option value="Producto Terminado">Producto Terminado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subcategoría *</label>
                  <input
                    type="text"
                    required
                    value={formSubcat}
                    onChange={(e) => setFormSubcat(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Unidad de Medida *</label>
                  <select
                    value={formUom}
                    onChange={(e) => setFormUom(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="unidades">Unidades (pz)</option>
                    <option value="litros">Litros (L)</option>
                    <option value="kg">Kilogramos (Kg)</option>
                    <option value="m">Metros (m)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Stock Mínimo (Alerta)</label>
                  <input
                    type="number"
                    min="0"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Stock Máximo (Capacidad)</label>
                  <input
                    type="number"
                    min="1"
                    value={formMaxStock}
                    onChange={(e) => setFormMaxStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Costo Unitario (PPP) ({currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formCost}
                    onChange={(e) => setFormCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    title="Costo promedio PPP recalculado automáticamente con órdenes de compra"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Precio de Venta Sugerido ({currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3.5 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg text-xs cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs cursor-pointer transition-colors shadow-md shadow-indigo-600/10"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AJUSTE MANUAL DE STOCK */}
      {showAdjustModal && focusedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in" id="adjust-stock-modal">
          <div className="bg-white rounded-2xl border border-gray-100 w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <span className="font-bold text-gray-800 text-sm">Ajustar Existencia - SKU: {focusedProduct.sku}</span>
              <button onClick={() => setShowAdjustModal(false)} className="p-1.5 hover:bg-gray-200 rounded-lg cursor-pointer"><X className="w-4.5 h-4.5" /></button>
            </div>
            <form onSubmit={handleAdjustmentSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Almacén a Afectar *</label>
                <select
                  required
                  value={adjWarehouse}
                  onChange={(e) => setAdjWarehouse(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name} (Dispo: {focusedProduct.warehouseStock[w.id] || 0} {focusedProduct.unitOfMeasure})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sentido de Ajuste</label>
                  <select
                    value={adjType}
                    onChange={(e) => {
                      const type = e.target.value as MovementType;
                      setAdjType(type);
                      setAdjSubtype(type === "entry" ? "initial" : "loss");
                    }}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="entry">INGRESO (+)</option>
                    <option value="exit">EGRESO (-)</option>
                    <option value="adjustment">AJUSTE FISICO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Motivo / Causa</label>
                  <select
                    value={adjSubtype}
                    onChange={(e) => setAdjSubtype(e.target.value as MovementSubType)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {adjType === "entry" && (
                      <>
                        <option value="return_client">Devolución de Cliente</option>
                        <option value="initial">Carga Inicial</option>
                        <option value="reconciliation">Ajuste de Auditoría</option>
                      </>
                    )}
                    {adjType === "exit" && (
                      <>
                        <option value="internal_use">Consumo Interno</option>
                        <option value="return_provider">Reclamo / Proveedor</option>
                      </>
                    )}
                    {adjType === "adjustment" && (
                      <>
                        <option value="loss">Merma / Pérdida</option>
                        <option value="theft">Faltante / Robo</option>
                        <option value="reconciliation">Reconciliación Física</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cantidad *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="E.g., 20"
                    value={adjQuantity || ""}
                    onChange={(e) => setAdjQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Lote Asociado (Opcional)</label>
                  <input
                    type="text"
                    placeholder="E.g., LOT-ETA-92"
                    value={adjLot}
                    onChange={(e) => setAdjLot(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notas de Auditoría / Justificación *</label>
                <textarea
                  required
                  placeholder="E.g., Reconciliación tras toma de inventario físico de fin de año..."
                  value={adjNotes}
                  onChange={(e) => setAdjNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none font-normal"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg text-xs cursor-pointer text-center"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-tr from-amber-600 to-amber-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-md transition-colors"
                >
                  Autorizar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VER DETALLE DE LOTES (BATCHES) */}
      {showLotsModal && focusedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in" id="lots-details-modal">
          <div className="bg-white rounded-2xl border border-gray-100 w-full max-w-lg overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <div>
                <span className="font-bold text-gray-800 text-sm block">Control de Lotes y Vencimientos</span>
                <span className="text-[10px] text-gray-400 font-mono">SKU: {focusedProduct.sku} - {focusedProduct.name}</span>
              </div>
              <button onClick={() => setShowLotsModal(false)} className="p-1.5 hover:bg-gray-200 rounded-lg cursor-pointer"><X className="w-4.5 h-4.5" /></button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="max-h-60 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-100">
                {focusedProduct.batches.map((b) => {
                  const now = new Date("2026-05-27T05:39:35Z");
                  const expDate = new Date(b.expirationDate);
                  const isExpired = expDate.getTime() <= now.getTime();
                  return (
                    <div key={b.id} className="p-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors text-xs font-medium text-slate-700">
                      <div>
                        <span className="font-mono font-bold text-gray-800 block text-xs">LOTE: {b.batchNumber}</span>
                        <span className="text-[10px] text-gray-400 font-mono">Ingresado: {b.receivedDate.split("T")[0]}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-800 font-mono block">{b.quantity} {focusedProduct.unitOfMeasure}</span>
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          isExpired ? "bg-red-50 text-red-700 border border-red-100 animate-pulse" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        }`}>
                          {isExpired ? "CADUCADO" : `Expira: ${b.expirationDate}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 border-dashed flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 leading-normal">
                  Los lotes se consumen automáticamente siguiendo la metodogía de <strong>PEPS / FIFO</strong> (Primeras Entradas, Primeras Salidas) en dispatcheos ordinarios si no se especifica un lote en particular.
                </p>
              </div>
            </div>
            <div className="p-3 bg-gray-50 border-t border-gray-100 text-right">
              <button onClick={() => setShowLotsModal(false)} className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-150 text-gray-700 font-bold rounded-lg text-xs cursor-pointer">
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

