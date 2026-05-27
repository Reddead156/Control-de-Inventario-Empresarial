/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Warehouse, Product } from "../types";
import { 
  Plus, 
  Warehouse as WhIcon, 
  ArrowRightLeft, 
  MapPin, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp,
  X
} from "lucide-react";

interface WarehousesPageProps {
  warehouses: Warehouse[];
  products: Product[];
  onAddWarehouse: (wh: any) => Promise<boolean>;
  onTransferInventory: (transferData: any) => Promise<boolean>;
  onRefresh: () => void;
}

export default function WarehousesPage({
  warehouses,
  products,
  onAddWarehouse,
  onTransferInventory,
  onRefresh
}: WarehousesPageProps) {
  // Modal controls
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states (Create Warehouse)
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formZones, setFormZones] = useState("Zona A - General, Zona B - Picking");

  // Form states (Transfer)
  const [transferSrc, setTransferSrc] = useState("");
  const [transferDest, setTransferDest] = useState("");
  const [transferProduct, setTransferProduct] = useState("");
  const [transferQuantity, setTransferQuantity] = useState(0);
  const [transferNotes, setTransferNotes] = useState("");

  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Safe computed options for transfers
  // Display only SKUs which have actual stock > 0 in the source warehouse
  const availableProductsInSrc = products.filter(p => {
    if (!transferSrc) return false;
    const stock = p.warehouseStock[transferSrc] || 0;
    return stock > 0 && p.status === "active";
  });

  // Calculate current available quantity for selected source and SKU
  const activeMaxStock = () => {
    if (!transferSrc || !transferProduct) return 0;
    const p = products.find(prod => prod.sku === transferProduct);
    return p ? (p.warehouseStock[transferSrc] || 0) : 0;
  };

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim() || !formName.trim()) {
      showNotification("error", "El código identificador y el nombre son mandatorios.");
      return;
    }

    const zonesArray = formZones.split(",").map(z => z.trim()).filter(Boolean);

    const newWh = {
      code: formCode.toUpperCase().trim(),
      name: formName.trim(),
      address: formAddress.trim(),
      zones: zonesArray.length ? zonesArray : ["Zona General"],
      status: "active" as const
    };

    const success = await onAddWarehouse(newWh);
    if (success) {
      showNotification("success", `Almacén '${newWh.code}' registrado con éxito.`);
      setShowAddModal(false);
      setFormCode("");
      setFormName("");
      setFormAddress("");
      setFormZones("Zona A - General, Zona B - Picking");
    } else {
      showNotification("error", "No se pudo registrar el almacén.");
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferSrc || !transferDest || !transferProduct) {
      showNotification("error", "Complete los parámetros obligatorios de traspaso.");
      return;
    }
    if (transferSrc === transferDest) {
      showNotification("error", "El almacén de destino debe ser diferente al de origen.");
      return;
    }
    if (transferQuantity <= 0) {
      showNotification("error", "La cantidad del traspaso debe ser superior a cero.");
      return;
    }

    const maxLimit = activeMaxStock();
    if (transferQuantity > maxLimit) {
      showNotification("error", `Excede el stock disponible en almacén de origen. Máximo traspasable: ${maxLimit}`);
      return;
    }

    const payload = {
      srcWarehouseId: transferSrc,
      destWarehouseId: transferDest,
      productSku: transferProduct,
      quantity: Number(transferQuantity),
      notes: transferNotes.trim() || "Traspaso administrativo entre sucursales."
    };

    const success = await onTransferInventory(payload);
    if (success) {
      showNotification("success", "Traspaso de inventario inter-almacén procesado con éxito.");
      // Reset form
      setTransferProduct("");
      setTransferQuantity(0);
      setTransferNotes("");
    } else {
      showNotification("error", "Ocurrió un error al procesar el traspaso.");
    }
  };

  // Compute aggregated physical units per warehouse
  const getWarehouseStockSum = (whId: string) => {
    return products.reduce((acc, p) => acc + (p.warehouseStock[whId] || 0), 0);
  };

  // Compute total valuation per warehouse
  const getWarehouseValuationSum = (whId: string) => {
    return products.reduce((acc, p) => acc + ((p.warehouseStock[whId] || 0) * p.avgCost), 0);
  };

  return (
    <div className="space-y-6" id="warehouses-page-view">
      {/* Intro Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Ubicaciones y Traspaso de Inventarios</h2>
          <p className="text-sm text-slate-500 mt-0.5">Control físico de centros logísticos, layout de almacenamiento interno y re-ubicación de materias primas.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl cursor-pointer shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          Registrar Nueva Bodega
        </button>
      </div>

      {/* Notifications Drawer */}
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

      {/* Main Grid: Left side list, Right side Transfer tool */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left side: List of active warehouses */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-800 text-sm mb-4">Centros de Distribución & Almacenes Activos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {warehouses.map((wh) => {
                const totalUnits = getWarehouseStockSum(wh.id);
                const valSum = getWarehouseValuationSum(wh.id);

                return (
                  <div 
                    key={wh.id} 
                    className="p-4 rounded-2xl border border-gray-150 bg-gray-50/40 hover:bg-gray-50 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                          <WhIcon className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-gray-800">{wh.name}</h4>
                          <span className="text-[10px] text-gray-400 font-mono font-bold uppercase">{wh.code}</span>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        ACTIVO
                      </span>
                    </div>

                    <div className="mt-4 space-y-2.5">
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate" title={wh.address}>{wh.address}</span>
                      </div>
                      
                      {/* Sub-Zones */}
                      <div className="flex gap-1.5 flex-wrap">
                        {wh.zones.map((z, i) => (
                          <span key={i} className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold font-mono">
                            {z}
                          </span>
                        ))}
                      </div>

                      {/* Summary physical analytics */}
                      <div className="border-t border-gray-200/60 pt-3 mt-1 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400 text-[9px] block uppercase font-bold tracking-wider">Stock Total</span>
                          <span className="font-extrabold text-slate-800 font-mono">{totalUnits.toLocaleString("es-ES")} u.</span>
                        </div>
                        <div className="text-right">
                          <span className="text-gray-400 text-[9px] block uppercase font-bold tracking-wider">Valoración PPP</span>
                          <span className="font-extrabold text-indigo-700 font-mono">${valSum.toLocaleString("es-ES", { maximumFractionDigits:2 })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right side: Intra-Warehouse Transfer Form */}
        <div>
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm sticky top-24">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-3">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <ArrowRightLeft className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-sm">Traspaso Autorizado Stock</h3>
                <p className="text-[10px] text-gray-400 font-medium">Reubicación con trazabilidad física inmediata</p>
              </div>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Bodega de Origen *</label>
                  <select
                    required
                    value={transferSrc}
                    onChange={(e) => {
                      setTransferSrc(e.target.value);
                      setTransferProduct("");
                      setTransferQuantity(0);
                    }}
                    className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
                  >
                    <option value="">--Seleccione--</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Bodega de Destino *</label>
                  <select
                    required
                    value={transferDest}
                    onChange={(e) => setTransferDest(e.target.value)}
                    className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
                  >
                    <option value="">--Seleccione--</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Producto a Traspasar *</label>
                <select
                  required
                  disabled={!transferSrc}
                  value={transferProduct}
                  onChange={(e) => {
                    setTransferProduct(e.target.value);
                    setTransferQuantity(0);
                  }}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none disabled:opacity-50 cursor-pointer"
                >
                  <option value="">{!transferSrc ? "Seleccione origen primero" : "--Elegir SKU disponible--"}</option>
                  {availableProductsInSrc.map(p => (
                    <option key={p.id} value={p.sku}>
                      {p.sku} - {p.name} (Dispo: {p.warehouseStock[transferSrc]} {p.unitOfMeasure})
                    </option>
                  ))}
                </select>
              </div>

              {transferProduct && (
                <div className="grid grid-cols-2 gap-4 items-end animate-fade-in">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Cantidad a Traspasar *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max={activeMaxStock()}
                      value={transferQuantity || ""}
                      onChange={(e) => setTransferQuantity(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="py-2.5 px-3 bg-indigo-50 rounded-lg text-xs text-indigo-700 font-mono text-center border border-indigo-150">
                    Lím: <strong className="font-extrabold">{activeMaxStock()}</strong> disp.
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Notas de Traspaso / Justificación *</label>
                <textarea
                  required
                  placeholder="E.g., Abastecimiento del departamento de formulación de la OP-12."
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none font-normal"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-indigo-600/10 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                Ejecutar Traspaso
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* MODAL: REGISTRAR NUEVA BODEGA */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in" id="add-warehouse-modal">
          <div className="bg-white rounded-2xl border border-gray-100 w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <span className="font-bold text-gray-800 text-sm">Registrar Nueva Bodega</span>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-gray-200 rounded-lg cursor-pointer"><X className="w-4.5 h-4.5" /></button>
            </div>
            <form onSubmit={handleCreateWarehouse} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Código Identificador (ID) *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., ALM-04"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Descriptivo *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Almacén Sur"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dirección Física Completa</label>
                <input
                  type="text"
                  placeholder="E.g., Autopista Sur Km 3, Parque Industrial"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Zonas Físicas de Almacenamiento (Separado por Comas)</label>
                <input
                  type="text"
                  placeholder="E.g., Zona A - General, Zona B - Picking"
                  value={formZones}
                  onChange={(e) => setFormZones(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-400 mt-1.5 block">Separe cada zona física por coma para configurar el layout.</span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg text-xs cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-md shadow-indigo-600/10 transition-colors"
                >
                  Registrar Almacén
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

