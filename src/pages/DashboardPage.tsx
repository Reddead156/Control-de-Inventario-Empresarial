/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SVGBarChart, SVGLineChart, SVGDonutChart } from "../components/SVGCharts";
import KPICards from "../components/KPICards";
import { Product, InventoryMovement, SystemConfig } from "../types";
import { ArrowUpRight, ArrowDownLeft, SlidersHorizontal, AlertTriangle, ShieldCheck, History } from "lucide-react";

interface DashboardPageProps {
  products: Product[];
  movements: InventoryMovement[];
  config: SystemConfig;
  onPageChange: (page: string) => void;
}

export default function DashboardPage({ products, movements, config, onPageChange }: DashboardPageProps) {
  const currencySymbol = config.currencySymbol || "$";

  // Prepare categories breakdown data for bar chart
  const categoriesBreakdown = () => {
    const cats: Record<string, number> = {};
    for (const p of products) {
      cats[p.category] = (cats[p.category] || 0) + p.currentStock;
    }
    return Object.entries(cats).slice(0, 5).map(([label, value]) => ({ label, value }));
  };

  // Prepare trend data of movements for line chart (last 5 entries)
  const movementsTrend = () => {
    const sorted = [...movements].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const slice = sorted.slice(-6); // last 6 trend points
    return slice.map((m) => {
      const dateObj = new Date(m.date);
      const label = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
      return { label, value: m.quantity };
    });
  };

  // Warehouse distribution dataset for donut chart
  const warehouseDistribution = () => {
    const stockMap: Record<string, number> = {};
    for (const p of products) {
      for (const [whId, stock] of Object.entries(p.warehouseStock)) {
        // Human label for warehouse
        let name = "Almacén Central";
        if (whId === "alm-2") name = "Dep. Mat. Prima";
        if (whId === "alm-3") name = "Bodega Este";
        stockMap[name] = (stockMap[name] || 0) + stock;
      }
    }
    return Object.entries(stockMap).map(([label, value]) => ({ label, value }));
  };

  const barData = categoriesBreakdown().length > 0 ? categoriesBreakdown() : [
    { label: "Sin Datos", value: 10 }
  ];

  const lineData = movementsTrend().length > 0 ? movementsTrend() : [
    { label: "21/5", value: 20 },
    { label: "22/5", value: 45 },
    { label: "23/5", value: 30 },
    { label: "24/5", value: 80 },
    { label: "25/5", value: 50 },
    { label: "26/5", value: 140 }
  ];

  const donutData = warehouseDistribution().length > 0 ? warehouseDistribution() : [
    { label: "Vacío", value: 100 }
  ];

  // Critical items check (Stock alert)
  const lowStockProducts = products
    .filter(p => p.currentStock <= p.minStock && p.status === "active")
    .slice(0, 4);

  // Latest 5 physical additions or dispatches
  const recentMovements = movements.slice(0, 5);

  return (
    <div className="space-y-6" id="dashboard-page-view">
      {/* Intro Greetings Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Panel Ejecutivo de Inventario</h2>
          <p className="text-sm text-slate-500 mt-1">Supervisión en tiempo real de lotes industriales, transferencias y cadena de valor.</p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-slate-600 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
          <span className="font-semibold uppercase text-indigo-600 text-[10px] bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">Cierre Contable</span>
          <span>Reglas de Trazabilidad NIIF</span>
        </div>
      </div>

      {/* Primary KPI Indicators row */}
      <KPICards products={products} currencySymbol={currencySymbol} />

      {/* Main Grid Layout for Visual Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Category distribution bar chart */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-800 text-sm">Distribución de Existencias por Categoría</h3>
              <p className="text-xs text-gray-400 mt-0.5">Suma agregada de unidades físicas s/ categorías principales</p>
            </div>
            <SlidersHorizontal className="w-4 h-4 text-gray-400" />
          </div>
          <div className="pt-4">
            <SVGBarChart data={barData} color="#4f46e5" height={190} />
          </div>
        </div>

        {/* Right column: Warehouse stock distribution donut */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-800 text-sm">Stock por Bodega de Control</h3>
              <p className="text-xs text-gray-400 mt-0.5">Fragmentación por ubicaciones físicas</p>
            </div>
          </div>
          <div className="pt-4">
            <SVGDonutChart data={donutData} />
          </div>
        </div>
      </div>

      {/* Secondary Graphs grid row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analytics Movement Flow Trend (Line Chart) */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-800 text-sm">Flujo de Trazabilidad Histórica</h3>
              <p className="text-xs text-gray-400 mt-0.5">Volatilidad de cantidades en las últimas transacciones</p>
            </div>
            <History className="w-4 h-4 text-gray-400" />
          </div>
          <div className="pt-4">
            <SVGLineChart data={lineData} color="#10b981" height={180} />
          </div>
        </div>

        {/* Operational deficit alarms list */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 text-sm">Ruptura de Stock Inminente</h3>
              <span className="text-[10px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full font-bold">ALERTA</span>
            </div>
            <div className="space-y-3.5">
              {lowStockProducts.length === 0 ? (
                <div className="py-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-100">
                  <ShieldCheck className="w-7 h-7 text-emerald-500 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-gray-700">Abastecimiento Conforme</p>
                  <p className="text-[10px] text-gray-400">Todos los SKUs superan mínimos.</p>
                </div>
              ) : (
                lowStockProducts.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/50 border border-rose-100 hover:bg-rose-50 transition-colors">
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-gray-800 truncate" title={p.name}>{p.name}</p>
                      <span className="text-[9px] text-slate-400 font-mono">SKU: {p.sku}</span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-bold text-rose-600 font-mono block">{p.currentStock} {p.unitOfMeasure}</span>
                      <span className="text-[9px] text-slate-400">Mín: {p.minStock}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          {lowStockProducts.length > 0 && (
            <button
              onClick={() => onPageChange("products")}
              className="w-full mt-4 text-center text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
            >
              Gestionar Reabastecimiento →
            </button>
          )}
        </div>
      </div>

      {/* Ledger movements ticker details */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-3">
          <div>
            <h3 className="font-bold text-gray-800 text-sm">Últimos Movimientos del Ledger</h3>
            <p className="text-xs text-gray-400 mt-0.5">Auditoría física de entradas, salidas y reconciliaciones</p>
          </div>
          <button
            onClick={() => onPageChange("movements")}
            className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
          >
            Ver Libro Mayor Completo
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="dashboard-recent-movements-table">
            <thead>
              <tr className="text-[10px] text-gray-400 uppercase tracking-wider font-bold border-b border-gray-100 pb-2">
                <th className="py-2.5">Fecha</th>
                <th>Acción</th>
                <th>SKU & Descripción</th>
                <th>Cantidad</th>
                <th>Ubicación</th>
                <th>Operador</th>
                <th className="text-right">Valores</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs text-gray-700 font-medium">
              {recentMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">No se registran movimientos recientes.</td>
                </tr>
              ) : (
                recentMovements.map((m) => {
                  const isEntry = m.type === "entry";
                  const isExit = m.type === "exit";
                  
                  return (
                    <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 text-slate-400 font-mono">
                        {new Date(m.date).toLocaleString("es-ES", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}
                      </td>
                      <td>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isEntry 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                            : isExit 
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-100" 
                              : "bg-gray-50 text-gray-700 border border-gray-100"
                        }`}>
                          {isEntry ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDownLeft className="w-3.5 h-3.5 text-indigo-600" />}
                          {m.subType.toUpperCase()}
                        </span>
                      </td>
                      <td className="max-w-xs truncate">
                        <span className="font-bold text-gray-800 block" title={m.productName}>{m.productName}</span>
                        <span className="text-[10px] text-gray-400 font-mono">SKU: {m.productSku}</span>
                      </td>
                      <td className="font-bold font-mono">
                        {isExit ? "-" : "+"}{m.quantity}
                      </td>
                      <td className="text-gray-500 font-medium">{m.warehouseName}</td>
                      <td className="text-gray-400 font-mono text-[10px]">{m.userEmail}</td>
                      <td className="text-right font-bold text-slate-800 font-mono">
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

