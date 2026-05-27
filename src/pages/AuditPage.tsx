/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { AuditLog } from "../types";
import { ShieldCheck, Search, Filter, ShieldAlert, Monitor, UserCheck } from "lucide-react";

interface AuditPageProps {
  auditLogs: AuditLog[];
}

export default function AuditPage({ auditLogs }: AuditPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState("all");

  const modules = Array.from(new Set(auditLogs.map(l => l.module)));

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = selectedModule === "all" || log.module === selectedModule;

    return matchesSearch && matchesModule;
  });

  return (
    <div className="space-y-6" id="security-audit-page">
      {/* Intro Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Trazabilidad de Auditoría & Seguridad</h2>
          <p className="text-sm text-slate-500 mt-0.5 font-sans leading-normal">Bitácora inmutable de eventos de acceso, modificaciones de costos, dispensas y logs administrativos.</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-150 px-3.5 py-2 rounded-xl font-bold font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span>ISO 27001 SECURE AUDIT LOG</span>
        </div>
      </div>

      {/* Advanced Filtration list */}
      <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por usuario, IP, acción o detalles de modificación técnica..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
          />
        </div>

        <div className="relative w-full md:w-56">
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="w-full pl-3.5 pr-8 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-slate-650 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 appearance-none cursor-pointer"
          >
            <option value="all">Cualquier módulo</option>
            {modules.map(mod => (
              <option key={mod} value={mod}>{mod.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Ledger layout */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="audit-logs-table">
            <thead>
              <tr className="bg-gray-50 text-[10px] text-gray-500 uppercase tracking-wider font-extrabold border-b border-gray-100">
                <th className="py-3 px-6">Marca de Tiempo</th>
                <th>Usuario Responsable</th>
                <th>Rol</th>
                <th>Operación Crítica</th>
                <th>Módulo</th>
                <th>Detalles de Cambios</th>
                <th className="text-right py-3 px-6">Dirección IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-750 font-semibold leading-normal">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <ShieldAlert className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    <p className="font-semibold text-gray-600 text-sm">Sin logs de auditoría encontrados</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isAdmin = log.userRole === "Admin";
                  return (
                    <tr key={log.id} className="hover:bg-gray-50/45 transition-colors">
                      <td className="py-4 px-6 text-slate-400 font-mono font-bold">
                        {new Date(log.date).toLocaleString("es-ES")}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4.5 h-4.5 text-slate-400" />
                          <span className="font-bold text-slate-800">{log.userEmail}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-tight ${
                          isAdmin 
                            ? "bg-rose-50 text-rose-800 border border-rose-100" 
                            : "bg-blue-50 text-blue-850 border border-blue-100"
                        }`}>
                          {log.userRole}
                        </span>
                      </td>
                      <td className="font-bold text-slate-900">{log.action}</td>
                      <td>
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase">
                          {log.module}
                        </span>
                      </td>
                      <td className="max-w-md truncate text-gray-500 font-normal" title={log.details}>
                        {log.details}
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-slate-400 flex items-center justify-end gap-1 font-bold">
                        <Monitor className="w-3.5 h-3.5 text-slate-350" />
                        <span>{log.ipAddress}</span>
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

