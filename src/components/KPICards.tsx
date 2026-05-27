/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TrendingUp, RefreshCw, TriangleAlert, DollarSign, Database, HardDrive } from "lucide-react";
import { Product } from "../types";

interface KPICardsProps {
  products: Product[];
  currencySymbol: string;
}

export default function KPICards({ products, currencySymbol }: KPICardsProps) {
  // Compute total valuation of assets (PPP Method)
  const totalValuation = products.reduce((acc, p) => {
    return acc + (p.currentStock * p.avgCost);
  }, 0);

  // Total SKU count in Catalog
  const totalSKUs = products.length;

  // Active units logic
  const totalUnits = products.reduce((acc, p) => acc + p.currentStock, 0);

  // Risk elements (Stock below min or expired lots)
  const riskUnits = products.filter(p => p.currentStock <= p.minStock && p.status === "active").length;

  const kpis = [
    {
      id: "kpi-val",
      title: "Valoración de Activos (PPP)",
      value: `${currencySymbol}${totalValuation.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      description: "Inventario total valuado al costo promedio ponderado",
      icon: DollarSign,
      color: "bg-indigo-50 text-indigo-600 border-indigo-100",
      accent: "text-indigo-600"
    },
    {
      id: "kpi-skus",
      title: "Amplitud de Catálogo (SKUs)",
      value: totalSKUs,
      description: "Códigos únicos activos controlados en ledger",
      icon: Database,
      color: "bg-blue-50 text-blue-600 border-blue-100",
      accent: "text-blue-600"
    },
    {
      id: "kpi-units",
      title: "Unidades Físicas Almacenadas",
      value: totalUnits.toLocaleString("es-ES"),
      description: "Suma volumétrica agregada inter-depósitos",
      icon: HardDrive,
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
      accent: "text-emerald-600"
    },
    {
      id: "kpi-risk",
      title: "SKUs con Alerta de Ruptura",
      value: riskUnits,
      description: "Productos activos por debajo del stock mínimo",
      icon: TriangleAlert,
      color: riskUnits > 0 ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-gray-50 text-gray-400 border-gray-100",
      accent: riskUnits > 0 ? "text-rose-600 animate-pulse" : "text-gray-400"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5" id="kpi-cards-deck">
      {kpis.map((k) => {
        const Icon = k.icon;
        return (
          <div 
            key={k.id} 
            className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{k.title}</span>
              <div className={`p-2 rounded-xl border ${k.color}`}>
                <Icon className="w-4.5 h-4.5" />
              </div>
            </div>
            <div>
              <p className={`text-2xl font-bold tracking-tight text-gray-900 ${k.accent}`}>{k.value}</p>
              <p className="text-xs text-gray-400 mt-1 font-medium">{k.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

