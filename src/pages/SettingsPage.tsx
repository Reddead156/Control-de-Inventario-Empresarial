/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Settings, 
  HelpCircle, 
  CheckCircle2, 
  Coins, 
  Percent, 
  Building2, 
  BellRing,
  Award,
  Database
} from "lucide-react";

interface SettingsPageProps {
  companyName: string;
  setCompanyName: (name: string) => void;
  currencySymbol: string;
  setCurrencySymbol: (symbol: string) => void;
  taxRate: number;
  setTaxRate: (rate: number) => void;
  onRefresh: () => void;
}

export default function SettingsPage({
  companyName,
  setCompanyName,
  currencySymbol,
  setCurrencySymbol,
  taxRate,
  setTaxRate,
  onRefresh
}: SettingsPageProps) {
  const [fCompany, setFCompany] = useState(companyName);
  const [fCurrency, setFCurrency] = useState(currencySymbol);
  const [fTax, setFTax] = useState(taxRate);

  const [notif, setNotif] = useState<string | null>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setCompanyName(fCompany.trim());
    setCurrencySymbol(fCurrency);
    setTaxRate(Number(fTax));

    setNotif("Parámetros globales guardados en los archivos de configuración local.");
    setTimeout(() => {
      setNotif(null);
      onRefresh();
    }, 3000);
  };

  return (
    <div className="space-y-6" id="settings-config-page">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800">Parametrización del ERP e Información Legal</h2>
        <p className="text-sm text-slate-500 mt-0.5">Definición de moneda base, régimen tributario nacional, alertas de lote crítico e identidad corporativa.</p>
      </div>

      {notif && (
        <div className="p-4 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-250 flex items-center gap-3.5 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{notif}</span>
        </div>
      )}

      {/* Grid panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <form onSubmit={handleSaveSettings} className="bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-150 bg-gray-50 flex items-center gap-2">
              <Building2 className="w-4.5 h-4.5 text-indigo-600" />
              <h3 className="font-bold text-gray-800 text-sm">Ficha de Identidad & Parámetros Fiscales</h3>
            </div>

            <div className="p-6 space-y-5 text-xs font-semibold">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-gray-500 uppercase mb-1">Razón Social Corporativa (Compañía) *</label>
                  <input
                    type="text"
                    required
                    value={fCompany}
                    onChange={(e) => setFCompany(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 uppercase mb-1">Moneda Base de Registro (Layout) *</label>
                  <select
                    value={fCurrency}
                    onChange={(e) => setFCurrency(e.target.value)}
                    className="w-full px-2.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs cursor-pointer focus:outline-none"
                  >
                    <option value="$">Pesos Colombianos/Mexicanos ($)</option>
                    <option value="US$">Dólares Americanos (US$)</option>
                    <option value="€">Euros (€)</option>
                    <option value="S/.">Soles Peruanos (S/.)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-500 uppercase mb-1">Tasa Impositiva Estándar (19% IVA) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={fTax}
                      onChange={(e) => setFTax(Number(e.target.value))}
                      className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <Percent className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-gray-100 p-3.5 rounded-xl flex items-start gap-3">
                <BellRing className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1 text-slate-550 leading-relaxed font-normal">
                  <p className="font-bold text-slate-800 text-[11px]">SISTEMA DE NOTIFICACIONES AUTO-AJUSTADO:</p>
                  <p className="text-[10px]">Las alertas críticas de desabasto y vencimientos próximos se calculan en base a estos parámetros fijos del ERP y se despliegan en el centro de avisos del encabezado.</p>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-150">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-indigo-600/10 transition-colors"
                >
                  Guardar Configuraciones
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right sidebar details */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
            <h4 className="font-bold text-gray-800 text-sm flex items-center gap-1.5 border-b border-gray-50 pb-2.5">
              <Award className="w-4.5 h-4.5 text-indigo-510" />
              Estado del Servidor ERP
            </h4>
            <div className="space-y-3.5 text-xs text-slate-550 font-semibold leading-normal">
              <div className="flex justify-between border-b border-gray-50 pb-1.5">
                <span>Versión Engine:</span>
                <span className="font-mono font-bold text-slate-800">v1.4.2-Stable</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-1.5">
                <span>Tolerancia de Caídas:</span>
                <span className="text-emerald-600">Alta (File DB Backed)</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-1.5">
                <span>Persistencia local:</span>
                <span className="font-mono text-slate-800">data/db.json Sinc</span>
              </div>
              <div className="flex justify-between">
                <span>Sesión Operador:</span>
                <span className="text-slate-800 font-bold">admin@grupofarmaceutico.com</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-3">
            <h4 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
              <Database className="w-4.5 h-4.5 text-slate-600" />
              Resguardo de Información
            </h4>
            <p className="text-[10px] text-gray-400 leading-normal">Utilice el exportador de datos ubicado en el módulo de Reportes antes de realizar modificaciones estructurales o de redefinición.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

