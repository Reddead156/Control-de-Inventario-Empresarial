/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { InventoryMovement } from "../types";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  History, 
  Filter, 
  User, 
  Clock, 
  Maximize2,
  FileText
} from "lucide-react";

interface MovementsPageProps {
  movements: InventoryMovement[];
  currencySymbol: string;
}

export default function MovementsPage({ movements, currencySymbol }: MovementsPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedSubType, setSelectedSubType] = useState("all");

  const subTypes = Array.from(new Set(movements.map(m => m.subType)));

  // Perform filtration
  const filteredMovements = movements.filter(m => {
    const matchesSearch = m.productSku.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.notes.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || m.type === selectedType;
    const matchesSubType = selectedSubType === "all" || m.subType === selectedSubType;

    return matchesSearch && matchesType && matchesSubType;
  });

  return (
    <div className="space-y-6" id="movements-page-view">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Libro Mayor de Inventarios (Kardex)</h2>
          <p className="text-sm text-slate-500 mt-0.5">Auditoría inmutable de transacciones físicas, costeo de entradas, egresos y ajustes contables.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-600 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
          <Clock className="w-3.5 h-3.5 text-indigo-500" />
          <span>LEDGER LOG: PEPS / PPP VALORADO</span>
        </div>
      </div>

      {/* Advanced Filtration */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3.5">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por SKU, producto, lote, nota de auditoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
            />
          </div>

          <div className="relative w-full md:w-52">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full pl-3.5 pr-8 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 appearance-none cursor-pointer"
            >
              <option value="all">Cualquier Sentido</option>
              <option value="entry">INGRESOS (+)</option>
              <option value="exit">EGRESOS (-)</option>
              <option value="adjustment">AJUSTES FISICOS</option>
            </select>
          </div>

          <div className="relative w-full md:w-52">
            <select
              value={selectedSubType}
              onChange={(e) => setSelectedSubType(e.target.value)}
              className="w-full pl-3.5 pr-8 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 appearance-none cursor-pointer"
            >
              <option value="all">Cualquier Origen</option>
              {subTypes.map((st) => (
                <option key={st} value={st}>{st.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Ledger movements table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="ledger-kardex-table">
            <thead>
              <tr className="bg-gray-50 text-[10px] text-gray-500 uppercase tracking-wider font-extrabold border-b border-gray-100">
                <th className="py-3 px-6">ID Trazador</th>
                <th>Fecha Sinc</th>
                <th>Sentido / Tipo</th>
                <th>SKU & Descripción</th>
                <th>Lote</th>
                <th>Almacén</th>
                <th>Detalle Justificación</th>
                <th>Cantidad</th>
                <th className="text-right py-3 px-6">Valoración Gral</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-medium">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    <History className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    <p className="font-semibold text-gray-600 text-sm">Libro de Kardex vacío</p>
                    <span className="text-[10px] text-gray-400">Modifique los filtros o registre un ajuste.</span>
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => {
                  const isEntry = m.type === "entry";
                  const isExit = m.type === "exit";
                  
                  return (
                    <tr key={m.id} className="hover:bg-gray-50/40 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-gray-400">{m.id.split("-").pop()?.toUpperCase()}</td>
                      <td className="font-mono text-slate-400">
                        {new Date(m.date).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isEntry 
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-100" 
                            : isExit 
                              ? "bg-indigo-50 text-indigo-800 border border-indigo-100" 
                              : "bg-amber-50 text-amber-800 border border-amber-150"
                        }`}>
                          {isEntry ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-650" /> : <ArrowDownLeft className="w-3.5 h-3.5 text-indigo-650" />}
                          {m.subType.toUpperCase()}
                        </span>
                      </td>
                      <td className="max-w-xs truncate">
                        <span className="font-extrabold text-slate-800 block">{m.productName}</span>
                        <span className="text-[10px] text-gray-400 font-mono font-bold">SKU: {m.productSku}</span>
                      </td>
                      <td className="font-mono font-bold text-slate-600">
                        {m.batchNumber ? (
                          <span className="bg-slate-150/40 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                            {m.batchNumber}
                          </span>
                        ) : (
                          <span className="text-gray-400 font-normal">--</span>
                        )}
                      </td>
                      <td className="text-slate-500 font-semibold">{m.warehouseName}</td>
                      <td className="max-w-xs truncate text-gray-400 font-normal" title={m.notes}>{m.notes}</td>
                      <td className="font-bold font-mono">
                        <span className={isEntry ? "text-emerald-600" : isExit ? "text-indigo-600" : "text-amber-600"}>
                          {isExit ? "-" : "+"}{m.quantity}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-slate-800 font-mono text-xs">
                        {currencySymbol}{m.totalValue.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

