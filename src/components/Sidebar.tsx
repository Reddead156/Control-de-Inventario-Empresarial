/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  LayoutDashboard, 
  Boxes, 
  Warehouse, 
  History, 
  Truck, 
  BadgePercent, 
  Factory, 
  FileSpreadsheet, 
  ShieldAlert, 
  Settings, 
  Menu, 
  X,
  Sparkles
} from "lucide-react";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ currentTab, setCurrentTab, isOpen, setIsOpen }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "products", label: "Catálogo de Productos", icon: Boxes },
    { id: "warehouses", label: "Almacenes y Traspasos", icon: Warehouse },
    { id: "movements", label: "Historial de Movimientos", icon: History },
    { id: "purchases", label: "Ordenes de Compra", icon: Truck },
    { id: "sales", label: "Ordenes de Venta", icon: BadgePercent },
    { id: "production", label: "Producción y Recetas", icon: Factory },
    { id: "reports", label: "Reportes y Auditoría", icon: FileSpreadsheet },
    { id: "audit", label: "Trazabilidad de Logs", icon: ShieldAlert },
    { id: "settings", label: "Configuraciones", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Burger Toggle overlay & button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-md shadow-lg duration-150 focus:ring-2 focus:ring-indigo-500"
        id="mobile-sidebar-toggle"
        aria-label="Toggle Navigation Sidebar"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="md:hidden fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-40 transition-opacity duration-200"
        />
      )}

      {/* Main Left Rail container */}
      <aside 
        className={`fixed top-0 left-0 h-screen w-64 bg-slate-900 border-r border-slate-800 text-slate-100 flex flex-col z-45 transition-transform duration-300 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        id="main-app-sidebar"
      >
        {/* Upper Brand / Logo Block */}
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-slate-800">
          <div className="w-9 h-9 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center text-white font-extrabold shadow-md">
            INV
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white leading-tight">ERP Control</h1>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider">SECURE LEDGER v1.2</span>
          </div>
        </div>

        {/* Navigation list items */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
          <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500 px-3 mb-2 block">
            Navegación Principal
          </div>
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isSelected = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setIsOpen(false); // Auto colapsible on click in mobile
                }}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group cursor-pointer ${
                  isSelected 
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" 
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <IconComponent className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-105 duration-100 ${
                  isSelected ? "text-white" : "text-slate-500 group-hover:text-slate-300"
                }`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Account / Footer Rail */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-indigo-400 ring-2 ring-slate-800">
              AM
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate leading-none mb-1">A. Montenegro</p>
              <span className="text-[10px] font-medium text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-900">Admin</span>
            </div>
          </div>
          <div className="text-slate-500 hover:text-white cursor-pointer" title="Soporte Inteligente AI">
            <Sparkles className="w-4 h-4 animate-pulse text-indigo-500" />
          </div>
        </div>
      </aside>
    </>
  );
}

