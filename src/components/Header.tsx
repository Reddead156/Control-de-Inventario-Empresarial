/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Bell, RefreshCw, AlertTriangle, ShieldCheck, User } from "lucide-react";
import { useState, useEffect } from "react";
import { Product } from "../types";

interface HeaderProps {
  products: Product[];
  onRefresh: () => void;
  isLoading: boolean;
}

export default function Header({ products, onRefresh, isLoading }: HeaderProps) {
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [alerts, setAlerts] = useState<{ id: string; type: "low" | "expired" | "expiring"; message: string; sku: string }[]>([]);

  // Compute live alerts relative to threshold configurations
  useEffect(() => {
    const list: typeof alerts = [];
    const now = new Date("2026-05-27T05:39:35Z");

    for (const p of products) {
      // 1. Check stock level warnings
      if (p.currentStock <= p.minStock && p.status === "active") {
        list.push({
          id: `low-${p.sku}`,
          type: "low",
          sku: p.sku,
          message: `Stock bajo en '${p.name}': Dispo: ${p.currentStock} ${p.unitOfMeasure} (Mín: ${p.minStock})`
        });
      }

      // 2. Check expiring lots
      for (const batch of p.batches) {
        if (batch.quantity <= 0) continue;
        const expDate = new Date(batch.expirationDate);
        const diffTime = expDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) {
          list.push({
            id: `exp-${p.sku}-${batch.batchNumber}`,
            type: "expired",
            sku: p.sku,
            message: `LOTE VENCIDO (${batch.batchNumber}) en '${p.name}': ${batch.quantity} ${p.unitOfMeasure} vencidos el ${batch.expirationDate}`
          });
        } else if (diffDays <= 30) {
          list.push({
            id: `expiring-${p.sku}-${batch.batchNumber}`,
            type: "expiring",
            sku: p.sku,
            message: `Lote por vencer (${batch.batchNumber}) en '${p.name}': Expira en ${diffDays} días (${batch.expirationDate})`
          });
        }
      }
    }
    setAlerts(list);
  }, [products]);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 md:px-8 shadow-sm">
      {/* Search / Page descriptive layout (Minimalist layout) */}
      <div className="flex items-center gap-4">
        {/* Placeholder spacer for mobile layout */}
        <div className="w-12 md:hidden" />
        <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full select-none">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
          <span className="text-slate-600">Base de Datos SQLite/JSON Conectada</span>
        </div>
      </div>

      {/* Main interaction deck */}
      <div className="flex items-center gap-4 relative" id="header-action-panel">
        {/* Manual Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors disabled:opacity-50"
          title="Refrescar Base de Datos"
          aria-label="Refrescar Base de Datos"
        >
          <RefreshCw className={`w-4.5 h-4.5 ${isLoading ? "animate-spin text-indigo-600" : ""}`} />
        </button>

        {/* Live Notification Indicator bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotificationDrawer(!showNotificationDrawer)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg cursor-pointer transition-all relative"
            id="notification-bell-btn"
            title="Consola de Alertas Críticas"
          >
            <Bell className="w-4.5 h-4.5" />
            {alerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-[9px] font-bold text-white rounded-full flex items-center justify-center ring-2 ring-white select-none scale-95">
                {alerts.length}
              </span>
            )}
          </button>

          {/* Alerts dropdown pane */}
          {showNotificationDrawer && (
            <div className="absolute right-0 mt-2.5 w-80 md:w-96 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden text-sm animate-fade-in-down" id="notifications-dropdown">
              <div className="p-4 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
                <span className="font-bold text-gray-800">Alertas Operativas ({alerts.length})</span>
                <span className="text-[10px] bg-indigo-50 text-indigo-600 font-mono px-2 py-0.5 rounded font-bold">CONTROL LOGISTICO</span>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                {alerts.length === 0 ? (
                  <div className="p-6 text-center text-gray-400">
                    <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-xs font-medium">No se detectaron alertas.</p>
                    <span className="text-[10px] text-gray-400">Todo el stock y lotes conformes s/ NIIF.</span>
                  </div>
                ) : (
                  alerts.map((al) => (
                    <div key={al.id} className="p-3.5 hover:bg-gray-50 flex gap-2.5 transition-colors">
                      <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${al.type === "expired" ? "text-rose-500" : al.type === "low" ? "text-amber-500" : "text-yellow-600"}`} />
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-medium leading-normal ${al.type === "expired" ? "text-rose-700" : "text-gray-700"}`}>
                          {al.message}
                        </p>
                        <span className="text-[9px] text-gray-400 font-mono">SKU: {al.sku}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {alerts.length > 0 && (
                <div className="p-2.5 bg-gray-50 border-t border-gray-100 text-center">
                  <span className="text-[10px] text-slate-400 font-medium">Consulte el módulo de Reportes para exportar alertas</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Vertical divider */}
        <span className="w-px h-6 bg-gray-200 hidden md:inline-block" />

        {/* User profile layout summary */}
        <div className="hidden md:flex items-center gap-2.5">
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-800 leading-none mb-1">Alejandro Montenegro</p>
            <span className="text-[10px] text-slate-400 block font-mono">admin@empresa.com</span>
          </div>
          <div className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg">
            <User className="w-4 h-4 text-slate-500" />
          </div>
        </div>
      </div>
    </header>
  );
}

