/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ProductionFormula, ProductionOrder, Product, ProductionIngredient } from "../types";
import { 
  Plus, 
  Settings, 
  Trash2, 
  Eye, 
  Activity, 
  Workflow, 
  CheckCircle2, 
  Ban, 
  Clock, 
  TriangleAlert,
  X,
  PlusCircle,
  Component
} from "lucide-react";

interface ProductionPageProps {
  formulas: ProductionFormula[];
  productionOrders: ProductionOrder[];
  products: Product[];
  currencySymbol: string;
  onAddFormula: (formula: any) => Promise<boolean>;
  onAddProductionOrder: (order: any) => Promise<boolean>;
  onEditProductionStatus: (id: string, status: string) => Promise<boolean>;
}

export default function ProductionPage({
  formulas,
  productionOrders,
  products,
  currencySymbol,
  onAddFormula,
  onAddProductionOrder,
  onEditProductionStatus
}: ProductionPageProps) {
  const [activeSegment, setActiveSegment] = useState<"formulas" | "orders">("formulas");

  // Create Formula Modals
  const [showAddFormulaModal, setShowAddFormulaModal] = useState(false);
  const [showAddOrderModal, setShowAddOrderModal] = useState(false);

  // Form states (Formula builder)
  const [fName, setFName] = useState("");
  const [fOutputSku, setFOutputSku] = useState("");
  const [fOutputQty, setFOutputQty] = useState(1000); // Standard batch size
  const [ingredientsList, setIngredientsList] = useState<ProductionIngredient[]>([]);
  
  // Single active formula line item selection
  const [ingSku, setIngSku] = useState("");
  const [ingQty, setIngQty] = useState(1);

  // Form states (Workorder builder)
  const [selectedFormulaId, setSelectedFormulaId] = useState("");
  const [targetQuantity, setTargetQuantity] = useState(1000);
  const [orderNotes, setOrderNotes] = useState("");

  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Add intermediate ingredient to building list
  const handleAddIngredientLine = () => {
    if (!ingSku || ingQty <= 0) return;
    const prod = products.find(p => p.sku === ingSku);
    if (!prod) return;

    if (ingredientsList.some(i => i.productSku === ingSku)) {
      showNotification("error", "Este ingrediente ya está configurado en las líneas de la receta.");
      return;
    }

    const newLine: ProductionIngredient = {
      productSku: ingSku,
      productName: prod.name,
      quantityNeeded: Number(ingQty)
    };

    setIngredientsList([...ingredientsList, newLine]);
    setIngSku("");
    setIngQty(1);
  };

  const handleRemoveIngredientLine = (sku: string) => {
    setIngredientsList(ingredientsList.filter(i => i.productSku !== sku));
  };

  const calculateDynamicFormulaCost = () => {
    return ingredientsList.reduce((acc, ing) => {
      const prod = products.find(p => p.sku === ing.productSku);
      const cost = prod ? prod.avgCost : 0;
      return acc + (ing.quantityNeeded * cost);
    }, 0);
  };

  // Submit recipe formula definition
  const handleConfirmRecipeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fName.trim() || !fOutputSku || ingredientsList.length === 0) {
      showNotification("error", "Se requiere el nombre, SKU del producto terminado y al menos un ingrediente.");
      return;
    }

    const prodFinished = products.find(p => p.sku === fOutputSku)!;

    const payload = {
      name: fName.trim(),
      productSku: fOutputSku,
      productName: prodFinished.name,
      ingredients: ingredientsList,
      standardOutputQuantity: fOutputQty,
      costEstimation: calculateDynamicFormulaCost()
    };

    const success = await onAddFormula(payload);
    if (success) {
      showNotification("success", "Fórmula industrial registrada de forma conforme.");
      setShowAddFormulaModal(false);
      setFName(""); setFOutputSku(""); setIngredientsList([]);
    } else {
      showNotification("error", "Error al crear la receta en base de datos.");
    }
  };

  // Submit Workorder execution schedule
  const handleConfirmWorkorderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFormulaId || targetQuantity <= 0) {
      showNotification("error", "Seleccione una receta activa e ingrese la cantidad objetivo.");
      return;
    }

    const formulaObj = formulas.find(f => f.id === selectedFormulaId)!;
    
    // Scale ingredients proportional to the standard output quantity of formula BOM
    // scales: targetQty / formulaObj.standardOutputQty
    const scaleFactor = targetQuantity / formulaObj.standardOutputQuantity;
    const consumedStockDetails = formulaObj.ingredients.map(ing => ({
      sku: ing.productSku,
      quantity: Number((ing.quantityNeeded * scaleFactor).toFixed(2))
    }));

    const payload = {
      formulaId: selectedFormulaId,
      formulaName: formulaObj.name,
      targetProductSku: formulaObj.productSku,
      targetProductName: formulaObj.productName,
      targetQuantity: Number(targetQuantity),
      dateStarted: new Date().toISOString(),
      consumedStockDetails,
      notes: orderNotes.trim() || "Proceso de envasado estandarizado."
    };

    const success = await onAddProductionOrder(payload);
    if (success) {
      showNotification("success", `Orden de fabricación lanzada con éxito para producir x${targetQuantity} unidades.`);
      setShowAddOrderModal(false);
      setSelectedFormulaId("");
      setOrderNotes("");
    } else {
      showNotification("error", "Falla al instanciar la órden de fabricación.");
    }
  };

  // Finish fabrication execution (causes automatic database adjustments)
  const handleCompleteWorkOrder = async (id: string) => {
    if (!confirm("¿Declarar OP Completada?\nEsto consumirá las materias primas del Depósito MP e ingresará el producto terminado en Almacén Central.")) return;
    
    const success = await onEditProductionStatus(id, "completed");
    if (success) {
      showNotification("success", "Lote industrial envasado correctamente. Inventario recalculado.");
    } else {
      showNotification("error", "MATERIALES INSUFICIENTES: No hay stock suficiente en el Depósito de Materias Primas para culminar este proceso.");
    }
  };

  // Cancel fabrication execution
  const handleCancelWorkOrder = async (id: string) => {
    if (confirm("¿Desestimar órden de fabricación?\nNo se afectarán materias primas o productos terminados.")) {
      const success = await onEditProductionStatus(id, "cancelled");
      if (success) {
        showNotification("success", "Orden de fabricación anulada.");
      } else {
        showNotification("error", "No se pudo anular la órden.");
      }
    }
  };

  return (
    <div className="space-y-6" id="mrp-production-page">
      {/* Intro header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Planificador de Producción (MRP)</h2>
          <p className="text-sm text-slate-500 mt-0.5">Gestión de recetas industriales (BOM), lanzamiento de órdenes de mezcla y trazabilidad automática de conversión.</p>
        </div>

        <button
          onClick={() => {
            if (activeSegment === "formulas") {
              setIngredientsList([]);
              setShowAddFormulaModal(true);
            } else {
              setShowAddOrderModal(true);
            }
          }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl cursor-pointer shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          {activeSegment === "formulas" ? "Registrar Receta (BOM)" : "Lanzar OP de Fabricación"}
        </button>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-3.5 border animate-fade-in ${
          notification.type === "success" 
            ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
            : "bg-rose-50 text-rose-800 border-rose-200"
        }`}>
          <Component className={`w-4 h-4 ${notification.type === "success" ? "text-emerald-600" : "text-rose-600"}`} />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Sub tabs */}
      <div className="flex border-b border-gray-100 gap-4">
        <button
          onClick={() => setActiveSegment("formulas")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeSegment === "formulas" ? "border-indigo-600 text-indigo-600 font-extrabold" : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Recetas Industriales (BOM)
        </button>
        <button
          onClick={() => setActiveSegment("orders")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeSegment === "orders" ? "border-indigo-600 text-indigo-600 font-extrabold" : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Ordenes de Fabricación s/ Proceso ({productionOrders.filter(o => o.status === "in_progress" || o.status === "pending").length} activistas)
        </button>
      </div>

      {/* Dynamic modules renderer */}
      {activeSegment === "formulas" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="bom-formulas-deck">
          {formulas.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white border border-gray-100 rounded-2xl text-slate-400">
              <Workflow className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="font-semibold text-gray-650 text-sm">No hay fórmulas de transformación configuradas</p>
            </div>
          ) : (
            formulas.map(f => (
              <div key={f.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-all">
                <div>
                  <h4 className="font-extrabold text-sm text-gray-800 leading-snug">{f.name}</h4>
                  <span className="text-[9.5px] text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 font-bold tracking-tight inline-block mt-1 font-mono uppercase">
                    Produce: {f.productSku}
                  </span>
                </div>

                {/* Ingredients summary */}
                <div className="space-y-1.5 border-t border-b border-gray-200/60 py-3 text-xs font-semibold text-slate-600">
                  <span className="text-[10px] text-gray-400 uppercase font-sans font-extrabold block mb-1">Insumos (Fórmula s/ estándar {f.standardOutputQuantity} {f.productSku.includes("GEL") ? "unidades" : "pz"})</span>
                  {f.ingredients.map((ing, i) => (
                    <div key={i} className="flex justify-between items-center bg-gray-50/50 p-1 rounded px-2 text-[11px] hover:bg-gray-50 transition-colors">
                      <span className="truncate max-w-[170px]" title={ing.productName}>{ing.productName}</span>
                      <strong className="text-slate-800 font-mono font-bold">{ing.quantityNeeded}u.</strong>
                    </div>
                  ))}
                </div>

                {/* Dynamic cost indicators computed inside model database */}
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[8px] text-gray-400 uppercase font-bold block">Costeo Teórico (BOM)</span>
                    <strong className="font-mono text-emerald-600 font-extrabold">
                      {currencySymbol}{f.costEstimation.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">PPP Método recalculante</span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden" id="production-checklists-table">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[10px] text-gray-500 uppercase tracking-wider font-extrabold border-b border-gray-100">
                <th className="py-3 px-6">ID Órden</th>
                <th>Fórmula de Conversión</th>
                <th>Fecha Lanzamiento</th>
                <th>Sustrato Producido (Porcentaje)</th>
                <th>Meta Cantidad</th>
                <th>Insumos Consolidados</th>
                <th>Estado OP</th>
                <th className="text-center py-3 px-6">Licitaciones / Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-medium whitespace-nowrap">
              {productionOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">No hay órdenes de fabricación registradas en el ledger.</td>
                </tr>
              ) : (
                productionOrders.map((order) => {
                  const isPending = order.status === "pending" || order.status === "in_progress";
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/40 transition-colors">
                      <td className="py-4 px-6 font-mono font-extrabold text-blue-600">OP-{order.id.slice(-6).toUpperCase()}</td>
                      <td>
                        <span className="font-bold text-gray-800 block text-xs" title={order.formulaName}>{order.formulaName}</span>
                        <span className="text-[9px] text-slate-400 font-mono">Formula ID: {order.formulaId}</span>
                      </td>
                      <td className="text-slate-400 font-mono">{new Date(order.dateStarted).toLocaleDateString("es-ES")}</td>
                      <td>
                        <span className="font-black text-slate-800 block text-xs" title={order.targetProductName}>{order.targetProductName}</span>
                        <span className="text-[9px] text-slate-400 font-mono">Meta: {order.targetProductSku}</span>
                      </td>
                      <td className="font-mono font-bold text-blue-700">x{order.targetQuantity}</td>
                      <td>
                        {/* Summary required ingredients scales */}
                        <div className="max-w-[150px] truncate" title={order.consumedStockDetails.map(i => `${i.sku}: ${i.quantity}`).join(", ")}>
                          {order.consumedStockDetails.map((ing, k) => (
                            <span key={k} className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded mr-1 font-mono font-bold">
                              {ing.sku.split("-")[1]}:{ing.quantity}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          order.status === "completed" 
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-100" 
                            : order.status === "in_progress"
                              ? "bg-blue-50 text-blue-800 border border-blue-100 animate-pulse"
                              : order.status === "cancelled"
                                ? "bg-rose-50 text-rose-800 border-rose-100"
                                : "bg-gray-100 text-gray-500"
                        }`}>
                          {order.status === "completed" ? "FABRICADA / LISTO" : order.status === "in_progress" ? "EN MEZCLADOR" : order.status === "cancelled" ? "ANULADA" : "COLA ESPERA"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {isPending ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleCompleteWorkOrder(order.id)}
                              className="p-1 px-2 border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded text-[10px] font-bold cursor-pointer"
                              title="Cierre de producción"
                            >
                              Finalizar s/ Lote
                            </button>
                            <button
                              onClick={() => handleCancelWorkOrder(order.id)}
                              className="p-1 border border-rose-200 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                              title="Anular Fabricación"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400">Sin Acciones</span>
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


      {/* MODAL: CONFIGURAR INDUSTRIAL RECETA (BOM) */}
      {showAddFormulaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in" id="add-formula-recipe-modal">
          <div className="bg-white rounded-2xl border border-gray-100 w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <span className="font-bold text-gray-800 text-sm">Configurar Fórmula s/ Receta Industrial (BOM)</span>
              <button onClick={() => setShowAddFormulaModal(false)} className="p-1.5 hover:bg-gray-200 rounded-lg cursor-pointer"><X className="w-4.5 h-4.5" /></button>
            </div>
            <form onSubmit={handleConfirmRecipeSubmit} className="p-6 space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-gray-500 uppercase mb-1">Nombre Técnico de Receta *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Fórmula Gel Lote Premium"
                    value={fName}
                    onChange={(e) => setFName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 uppercase mb-1">SKU Final Producido *</label>
                  <select
                    required
                    value={fOutputSku}
                    onChange={(e) => setFOutputSku(e.target.value)}
                    className="w-full px-2.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="">--Seleccionar Producto--</option>
                    {products.filter(p => p.category === "Producto Terminado" && p.status === "active").map(p => (
                      <option key={p.id} value={p.sku}>{p.sku} - {p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-500 uppercase mb-1">Tamaño Estándar de Lote (Meta) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="E.g., 1000"
                    value={fOutputQty || ""}
                    onChange={(e) => setFOutputQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Ingredients builder panel */}
              <div className="border border-gray-150 rounded-xl p-4 bg-gray-50/50 space-y-3">
                <h4 className="font-extrabold text-gray-700 text-xs border-b border-gray-200/50 pb-1.5 flex items-center gap-1.5 text-[11px] uppercase">
                  <Workflow className="w-4 h-4 text-slate-500" />
                  Estructura de Componentes de Receta (BOM)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] text-gray-500 uppercase mb-1">Materia Prima / Componente *</label>
                    <select
                      value={ingSku}
                      onChange={(e) => setIngSku(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer text-xs"
                    >
                      <option value="">--Elegir Componente--</option>
                      {products.filter(p => p.category !== "Producto Terminado" && p.status === "active").map(p => (
                        <option key={p.id} value={p.sku}>{p.sku} - {p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-[10px] text-gray-500 uppercase mb-1">Cantidad Necesaria *</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="Insumos"
                        value={ingQty || ""}
                        onChange={(e) => setIngQty(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-250 rounded-lg focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddIngredientLine}
                      className="bg-slate-900 text-white font-bold p-2 px-3 rounded-lg border cursor-pointer hover:bg-slate-800 transition-colors shadow-sm"
                    >
                      Añadir
                    </button>
                  </div>
                </div>

                {/* Ingredients Lines visual list */}
                <div className="max-h-32 overflow-y-auto divide-y divide-gray-150 border border-gray-250 rounded-lg bg-white">
                  {ingredientsList.length === 0 ? (
                    <div className="p-4 text-center text-gray-400 font-normal">No se han cargado ingredientes a la receta estándar.</div>
                  ) : (
                    ingredientsList.map((item) => (
                      <div key={item.productSku} className="p-2 flex items-center justify-between hover:bg-gray-50 text-slate-700">
                        <div>
                          <span className="font-extrabold block text-slate-800">{item.productName}</span>
                          <span className="text-[9px] text-gray-400 font-mono">SKU: {item.productSku}</span>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0 text-right">
                          <strong className="text-slate-800 font-mono">{item.quantityNeeded} unidades</strong>
                          <button
                            type="button"
                            onClick={() => handleRemoveIngredientLine(item.productSku)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* RECIPE COST CALCULATION */}
                {ingredientsList.length > 0 && (
                  <div className="bg-white rounded-lg p-2.5 border border-gray-200 flex justify-between font-mono text-[11px] items-center text-slate-800">
                    <span className="text-slate-400 font-sans">Estimación Global Costos (BOM):</span>
                    <strong className="text-emerald-600 font-black">{currencySymbol}{calculateDynamicFormulaCost().toLocaleString("es-ES", { minimumFractionDigits: 2 })}</strong>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddFormulaModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={ingredientsList.length === 0}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-lg cursor-pointer transition-colors shadow-md shadow-indigo-600/10"
                >
                  Confirmar Receta Standard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* MODAL: REGISTRAR WORKORDER (PRODUCTION PROCESS LAUNCH) */}
      {showAddOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in" id="add-workorder-manufacturing-modal">
          <div className="bg-white rounded-2xl border border-gray-100 w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <span className="font-bold text-gray-800 text-sm">Lanzar Órden de Fabricación Industrial</span>
              <button onClick={() => setShowAddOrderModal(false)} className="p-1.5 hover:bg-gray-200 rounded-lg cursor-pointer"><X className="w-4.5 h-4.5" /></button>
            </div>
            <form onSubmit={handleConfirmWorkorderSubmit} className="p-6 space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-gray-500 uppercase mb-1">Fórmula / Receta Industrial Activa *</label>
                <select
                  required
                  value={selectedFormulaId}
                  onChange={(e) => setSelectedFormulaId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer text-xs"
                >
                  <option value="">--Seleccionar Receta--</option>
                  {formulas.map(f => (
                    <option key={f.id} value={f.id}>{f.name} (Pr: {f.productSku})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-500 uppercase mb-1">Cantidad de Lote a Fabricar *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Cantidad objetivo"
                  value={targetQuantity || ""}
                  onChange={(e) => setTargetQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-500 uppercase mb-1">Notas / Observaciones de Línea Mezclado</label>
                <textarea
                  placeholder="Detalles sobre temperatura, empaque o turnos asignados."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-normal resize-none"
                />
              </div>

              <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-150 flex items-start gap-2 text-indigo-800 leading-normal animate-fade-in text-[11px]">
                <Clock className="w-4.5 h-4.5 flex-shrink-0 mt-0.5 text-indigo-600" />
                <p>
                  <strong>REGLAS DE FABRICACION:</strong> Al finalizar la orden (cierre de lote), el sistema de control MRP deducirá proporcionalmente los sustratos componentes del almacén Depósito de Materia Prima y añadirá el stock final producido en el Almacén Logístico Central.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddOrderModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer transition-colors shadow-md shadow-indigo-600/10"
                >
                  Autorizar Fabricación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

