/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Product, InventoryMovement, AuditLog } from "../types";
import { 
  Download, 
  FileSpreadsheet, 
  TrendingUp, 
  BarChart4, 
  ShieldAlert, 
  AlertCircle,
  CheckCircle2,
  BookmarkCheck
} from "lucide-react";

interface ReportsPageProps {
  products: Product[];
  movements: InventoryMovement[];
  auditLogs: AuditLog[];
  currencySymbol: string;
}

export default function ReportsPage({ products, movements, auditLogs, currencySymbol }: ReportsPageProps) {
  const [downloading, setDownloading] = useState<string | null>(null);

  // Helper exporter for CSV (Excel compatible)
  const downloadCSV = (filename: string, headers: string[], rows: any[][]) => {
    setDownloading(filename);
    setTimeout(() => {
      // Escape CSV values safely
      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(val => {
          const str = String(val === undefined || val === null ? "" : val);
          if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(","))
      ].join("\n");

      // Format to support UTF-8 BOM encoding for special chars in Excel
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloading(null);
    }, 700);
  };

  // 1. Export entire Catalogue
  const exportProductsCSV = () => {
    const headers = ["ID", "SKU Código", "Nombre", "Descripción", "Categoría", "Subcategoría", "Unidad Medida", "Stock Actual", "Costo Promedio (PPP)", "Precio Venta", "Valor Total"];
    const rows = products.map(p => [
      p.id,
      p.sku,
      p.name,
      p.description,
      p.category,
      p.subcategory,
      p.unitOfMeasure,
      p.currentStock,
      p.avgCost,
      p.price,
      p.currentStock * p.avgCost
    ]);
    downloadCSV("reporte_inventario_activo.csv", headers, rows);
  };

  // 2. Export Audit Ledger (Kardex)
  const exportMovementsCSV = () => {
    const headers = ["ID", "Fecha", "Tipo de Flujo", "Acción", "SKU Código", "Nombre de Producto", "Cantidad", "Almacen Físico", "Lote", "Operador", "Detalle Auditoría"];
    const rows = movements.map(m => [
      m.id,
      m.date,
      m.type,
      m.subType,
      m.productSku,
      m.productName,
      m.quantity,
      m.warehouseName,
      m.batchNumber || "SIN LOTE",
      m.userEmail,
      m.notes
    ]);
    downloadCSV("kardex_movimientos_historicos.csv", headers, rows);
  };

  // 3. Export security ledger logs
  const exportAuditCSV = () => {
    const headers = ["ID Log", "Fecha", "Usuario Email", "Rol de Acceso", "Acción Crítica", "Módulo", "Detalles", "Dirección IP"];
    const rows = auditLogs.map(l => [
      l.id,
      l.date,
      l.userEmail,
      l.userRole,
      l.action,
      l.module,
      l.details,
      l.ipAddress
    ]);
    downloadCSV("libro_mayor_auditoria_sistema.csv", headers, rows);
  };

  // Basic computed finance & rotation indicators
  const totalValuation = products.reduce((acc, p) => acc + (p.currentStock * p.avgCost), 0);
  const lowStockCount = products.filter(p => p.currentStock <= p.minStock && p.status === "active").length;
  const expiredLotsCount = products.reduce((acc, p) => {
    const now = new Date("2026-05-27T05:39:35Z");
    const count = p.batches.filter(b => b.quantity > 0 && new Date(b.expirationDate).getTime() <= now.getTime()).length;
    return acc + count;
  }, 0);

  // Rotation coefficient: simulated ratios (Sells exits relative to overall stock averages)
  const sellExitsCount = movements.filter(m => m.subType === "sale").reduce((acc, m) => acc + m.quantity, 0);
  const averageUnitsCount = products.reduce((acc, p) => acc + p.currentStock, 0) || 1;
  const rotationIndex = Number(((sellExitsCount / averageUnitsCount) * 100).toFixed(1));

  return (
    <div className="space-y-6" id="reports-downloads-page">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Reportes de Control & Auditorías NIIF</h2>
          <p className="text-sm text-slate-500 mt-0.5">Módulo de extracción de bases de datos, generación de planillas CSV para Excel y cálculo de coeficientes contables.</p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-slate-600 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
          <BookmarkCheck className="w-3.5 h-3.5 text-indigo-500" />
          <span>NORMA INTERNACIONAL: NIIF 2 (INVENTARIOS)</span>
        </div>
      </div>

      {/* Grid: Indicators row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Índice Rotación Industrial</span>
          <div className="flex items-center gap-2.5 mt-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <span className="text-xl font-mono font-black text-slate-800">{rotationIndex}%</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-2">Relación de egresos por ventas vs inventarios promedio</p>
        </div>

        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Lotes Caducados (Riesgo)</span>
          <div className="flex items-center gap-2.5 mt-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            <span className="text-xl font-mono font-black text-rose-600">{expiredLotsCount}</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-2">Lotes de inventarios físicamente vencidos s/ PEPS</p>
        </div>

        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Productos en Desabasto</span>
          <div className="flex items-center gap-2.5 mt-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <span className="text-xl font-mono font-black text-amber-600">{lowStockCount}</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-2">Modelos activos cuyas cantidades caen del mínimo</p>
        </div>

        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Valuación Libros Activos</span>
          <div className="flex items-center gap-2.5 mt-2">
            <BarChart4 className="w-5 h-5 text-indigo-500" />
            <span className="text-xl font-mono font-black text-indigo-600">
              {currencySymbol}{totalValuation.toLocaleString("es-ES", { maximumFractionDigits: 0 })}
            </span>
          </div>
          <p className="text-[10px] text-gray-400 mt-2">Suma valorizada global bajo costo promedio ponderado</p>
        </div>
      </div>

      {/* Main exporters row */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-800 text-sm mb-4">Descargas de Datos / Hojas de Cálculo</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5" id="exporters-action-grid">
          {/* Products Exporter */}
          <div className="p-5 border border-gray-150 rounded-2xl bg-gray-50/40 hover:bg-gray-50 hover:shadow-sm transition-all flex flex-col justify-between">
            <div>
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-150 w-fit mb-4">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-gray-800">Catálogo de SKUs Valorado</h4>
              <p className="text-xs text-gray-400 mt-1 pb-4 leading-normal">
                Base de datos completa de productos, descripciones, categorías, cantidades actuales, costosPPP y precios de despacho.
              </p>
            </div>
            <button
              onClick={exportProductsCSV}
              disabled={downloading !== null}
              className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-750 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md transition-colors flex items-center justify-center gap-2.5 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloading === "reporte_inventario_activo.csv" ? "Exportando..." : "Descargar CSV"}</span>
            </button>
          </div>

          {/* Movements Exporter */}
          <div className="p-5 border border-gray-150 rounded-2xl bg-gray-50/40 hover:bg-gray-50 hover:shadow-sm transition-all flex flex-col justify-between">
            <div>
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-150 w-fit mb-4">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-gray-800">Historial Ledger Completo (Kardex)</h4>
              <p className="text-xs text-gray-400 mt-1 pb-4 leading-normal">
                Egresos, ingresos, mermas, traslados entre sucursales y justificaciones registradas con marcas de tiempo.
              </p>
            </div>
            <button
              onClick={exportMovementsCSV}
              disabled={downloading !== null}
              className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-750 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md transition-colors flex items-center justify-center gap-2.5 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloading === "kardex_movimientos_historicos.csv" ? "Exportando..." : "Descargar CSV"}</span>
            </button>
          </div>

          {/* Log Exporter */}
          <div className="p-5 border border-gray-150 rounded-2xl bg-gray-50/40 hover:bg-gray-50 hover:shadow-sm transition-all flex flex-col justify-between">
            <div>
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-150 w-fit mb-4">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-gray-800">Libro de Trazabilidad y Seguridad</h4>
              <p className="text-xs text-gray-400 mt-1 pb-4 leading-normal">
                Registro de logins, altas, bajas de productos e historial completo de devaluaciones con IP y firma digital contable.
              </p>
            </div>
            <button
              onClick={exportAuditCSV}
              disabled={downloading !== null}
              className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-750 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md transition-colors flex items-center justify-center gap-2.5 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloading === "libro_mayor_auditoria_sistema.csv" ? "Exportando..." : "Descargar CSV"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

