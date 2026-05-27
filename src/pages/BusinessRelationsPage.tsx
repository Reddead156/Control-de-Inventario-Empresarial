/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Provider, Customer } from "../types";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Search, 
  Users, 
  Shuffle, 
  DollarSign, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Star,
  X,
  CreditCard
} from "lucide-react";

interface BusinessRelationsPageProps {
  providers: Provider[];
  customers: Customer[];
  currencySymbol: string;
  onAddProvider: (prov: any) => Promise<boolean>;
  onEditProvider: (id: string, updates: any) => Promise<boolean>;
  onAddCustomer: (cust: any) => Promise<boolean>;
  onEditCustomer: (id: string, updates: any) => Promise<boolean>;
}

export default function BusinessRelationsPage({
  providers,
  customers,
  currencySymbol,
  onAddProvider,
  onEditProvider,
  onAddCustomer,
  onEditCustomer
}: BusinessRelationsPageProps) {
  const [activeTab, setActiveTab] = useState<"providers" | "customers">("providers");
  const [searchTerm, setSearchTerm] = useState("");

  // Modals controls
  const [showAddProviderModal, setShowAddProviderModal] = useState(false);
  const [showEditProviderModal, setShowEditProviderModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);

  // Focus targets
  const [focusedProvider, setFocusedProvider] = useState<Provider | null>(null);
  const [focusedCustomer, setFocusedCustomer] = useState<Customer | null>(null);

  // Form States (Provider)
  const [pName, setPName] = useState("");
  const [pTax, setPTax] = useState("");
  const [pEmail, setPEmail] = useState("");
  const [pPhone, setPPhone] = useState("");
  const [pAddr, setPAddr] = useState("");
  const [pRating, setPRating] = useState(5);

  // Form States (Customer)
  const [cName, setCName] = useState("");
  const [cTax, setCTax] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cAddr, setCAddr] = useState("");
  const [cCredit, setCCredit] = useState(10000);

  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleProviderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName.trim() || !pTax.trim()) {
      showNotification("error", "El nombre y la identificación tributaria son obligatorios.");
      return;
    }

    const payload = {
      name: pName.trim(),
      taxId: pTax.trim().toUpperCase(),
      email: pEmail.trim(),
      phone: pPhone.trim(),
      address: pAddr.trim(),
      rating: Number(pRating),
      status: "active" as const
    };

    let success = false;
    if (focusedProvider) {
      success = await onEditProvider(focusedProvider.id, payload);
    } else {
      success = await onAddProvider(payload);
    }

    if (success) {
      showNotification("success", `Proveedor registrado/actualizado de manera exitosa.`);
      setShowAddProviderModal(false);
      setShowEditProviderModal(false);
      setPName(""); setPTax(""); setPEmail(""); setPPhone(""); setPAddr("");
      setFocusedProvider(null);
    } else {
      showNotification("error", "Error al guardar el proveedor.");
    }
  };

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim() || !cTax.trim()) {
      showNotification("error", "El nombre y el RUT/NIT fiscal son mandatorios.");
      return;
    }

    const payload = {
      name: cName.trim(),
      taxId: cTax.trim().toUpperCase(),
      email: cEmail.trim(),
      phone: cPhone.trim(),
      address: cAddr.trim(),
      creditLimit: Number(cCredit),
      status: "active" as const
    };

    let success = false;
    if (focusedCustomer) {
      success = await onEditCustomer(focusedCustomer.id, payload);
    } else {
      success = await onAddCustomer(payload);
    }

    if (success) {
      showNotification("success", `Cliente registrado/actualizado con total conformidad.`);
      setShowAddCustomerModal(false);
      setShowEditCustomerModal(false);
      setCName(""); setCTax(""); setCEmail(""); setCPhone(""); setCAddr("");
      setCCredit(10000);
      setFocusedCustomer(null);
    } else {
      showNotification("error", "Error al registrar el cliente.");
    }
  };

  const openEditProvider = (p: Provider) => {
    setFocusedProvider(p);
    setPName(p.name);
    setPTax(p.taxId);
    setPEmail(p.email);
    setPPhone(p.phone);
    setPAddr(p.address);
    setPRating(p.rating);
    setShowEditProviderModal(true);
  };

  const openEditCustomer = (c: Customer) => {
    setFocusedCustomer(c);
    setCName(c.name);
    setCTax(c.taxId);
    setCEmail(c.email);
    setCPhone(c.phone);
    setCAddr(c.address);
    setCCredit(c.creditLimit);
    setShowEditCustomerModal(true);
  };

  // Filtration logic
  const filteredProviders = providers.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.taxId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.taxId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6" id="relations-page-view">
      {/* Intro Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Directorio de Terceros y Socios Comerciales</h2>
          <p className="text-sm text-slate-500 mt-0.5">Control fiscal de proveedores de materia prima, limites de crédito bancario de clientes y antigüedad de cuentas.</p>
        </div>
        
        <button
          onClick={() => {
            if (activeTab === "providers") {
              setFocusedProvider(null);
              setShowAddProviderModal(true);
            } else {
              setFocusedCustomer(null);
              setShowAddCustomerModal(true);
            }
          }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl cursor-pointer shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          {activeTab === "providers" ? "Nuevo Proveedor" : "Nuevo Cliente"}
        </button>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-3.5 border animate-fade-in ${
          notification.type === "success" 
            ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
            : "bg-rose-50 text-rose-800 border-rose-200"
        }`}>
          <Star className={`w-4 h-4 ${notification.type === "success" ? "text-emerald-600" : "text-rose-600"}`} />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Relations Sub Tabs */}
      <div className="flex border-b border-gray-100 gap-4">
        <button
          onClick={() => { setActiveTab("providers"); setSearchTerm(""); }}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "providers" ? "border-indigo-600 text-indigo-600 font-extrabold" : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Proveedores Suministro ({providers.length})
        </button>
        <button
          onClick={() => { setActiveTab("customers"); setSearchTerm(""); }}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "customers" ? "border-indigo-600 text-indigo-600 font-extrabold" : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Clientes & Cuentas Clave ({customers.length})
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
        <input
          type="text"
          placeholder={`Buscar ${activeTab === "providers" ? "proveedores" : "clientes"} por nombre comercial o registro fiscal...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm"
        />
      </div>

      {/* Dynamic Display */}
      {activeTab === "providers" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="providers-relation-deck">
          {filteredProviders.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white border border-gray-100 rounded-2xl text-gray-400">
              <Star className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="font-semibold text-gray-600 text-sm">No hay proveedores registrados</p>
            </div>
          ) : (
            filteredProviders.map(p => (
              <div key={p.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-sm text-gray-800 truncate">{p.name}</h4>
                    <span className="text-[10px] text-gray-400 font-mono font-bold block">{p.taxId}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 text-amber-500">
                    {Array.from({ length: p.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    ))}
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{p.email || "No registrado"}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{p.phone || "No registrado"}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{p.address}</span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-gray-400 uppercase font-bold block">Balance Cuentas x Pagar</span>
                    <span className="text-xs font-mono font-black text-rose-600">
                      {currencySymbol}{p.balance.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditProvider(p)}
                      className="p-1 px-2 border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded text-[10px] font-bold cursor-pointer flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Editar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="customers-relation-deck">
          {filteredCustomers.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white border border-gray-100 rounded-2xl text-gray-400">
              <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="font-semibold text-gray-600 text-sm">No hay clientes agregados</p>
            </div>
          ) : (
            filteredCustomers.map(c => (
              <div key={c.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-all">
                <div className="flex items-start justify-between min-w-0">
                  <div>
                    <h4 className="font-extrabold text-sm text-gray-800 truncate">{c.name}</h4>
                    <span className="text-[10px] text-gray-400 font-mono block font-bold">{c.taxId}</span>
                  </div>
                  <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    CRÉDITO ACTIVO
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{c.email || "No registrado"}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{c.phone || "No registrado"}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{c.address}</span>
                  </div>
                </div>

                {/* Credit balance metrics */}
                <div className="bg-slate-50 rounded-xl p-3 border border-gray-100 grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[8px] text-gray-400 uppercase font-sans font-bold block">Crédito Concedido</span>
                    <strong className="text-slate-800">{currencySymbol}{c.creditLimit.toLocaleString("es-ES")}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] text-gray-400 uppercase font-sans font-bold block">Disponible</span>
                    <strong className="text-emerald-600">{currencySymbol}{c.availableCredit.toLocaleString("es-ES")}</strong>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-gray-400 uppercase font-bold block">Cuentas por Cobrar</span>
                    <span className="text-xs font-mono font-black text-indigo-700">
                      {currencySymbol}{c.balance.toLocaleString("es-ES", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <button
                    onClick={() => openEditCustomer(c)}
                    className="p-1 px-2 border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded text-[10px] font-bold cursor-pointer flex items-center gap-1"
                  >
                    <Edit className="w-3 h-3" />
                    <span>Editar</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}


      {/* MODAL: SUPPLIER FORM (ADD/EDIT) */}
      {(showAddProviderModal || showEditProviderModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in" id="supplier-form-modal">
          <div className="bg-white rounded-2xl border border-gray-100 w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <span className="font-bold text-gray-800 text-sm">
                {focusedProvider ? "Editar Socio Suministrador" : "Registrar Proveedor Autorizado"}
              </span>
              <button onClick={() => { setShowAddProviderModal(false); setShowEditProviderModal(false); }} className="p-1.5 hover:bg-gray-200 rounded-lg cursor-pointer"><X className="w-4.5 h-4.5" /></button>
            </div>
            <form onSubmit={handleProviderSubmit} className="p-6 space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-gray-500 uppercase mb-1">Razón Social S.A. / Ltda. / Persona *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Químicos Globales S.A."
                    value={pName}
                    onChange={(e) => setPName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-550 uppercase mb-1">Identificación Tributaria (RUT/NIT) *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., NIT-928122-1"
                    value={pTax}
                    onChange={(e) => setPTax(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 uppercase mb-1">Desempeño / Calificación</label>
                  <select
                    value={pRating}
                    onChange={(e) => setPRating(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="5">Excelente (5 Estrellas)</option>
                    <option value="4">Muy Bueno (4 Estrellas)</option>
                    <option value="3">Regular (3 Estrellas)</option>
                    <option value="2">Bajo (2 Estrellas)</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-500 uppercase mb-1">Correo Electrónico de Pedidos</label>
                  <input
                    type="email"
                    placeholder="E.g., ventas@proveedor.com"
                    value={pEmail}
                    onChange={(e) => setPEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-500 uppercase mb-1">Teléfono Corporativo o Móvil</label>
                  <input
                    type="text"
                    placeholder="E.g., +57 (601) 888-9900"
                    value={pPhone}
                    onChange={(e) => setPPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-500 uppercase mb-1">Dirección Oficina Principal</label>
                  <input
                    type="text"
                    placeholder="E.g., Autopista Norte # 244, Bogotá"
                    value={pAddr}
                    onChange={(e) => setPAddr(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3.5 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setShowAddProviderModal(false); setShowEditProviderModal(false); }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer transition-colors shadow-md shadow-indigo-600/10"
                >
                  Confirmar Guardado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* MODAL: CUSTOMER FORM (ADD/EDIT) */}
      {(showAddCustomerModal || showEditCustomerModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in" id="customer-form-modal">
          <div className="bg-white rounded-2xl border border-gray-100 w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <span className="font-bold text-gray-800 text-sm">
                {focusedCustomer ? "Editar Ficha Cliente" : "Registrar Comercial Clave"}
              </span>
              <button onClick={() => { setShowAddCustomerModal(false); setShowEditCustomerModal(false); }} className="p-1.5 hover:bg-gray-200 rounded-lg cursor-pointer"><X className="w-4.5 h-4.5" /></button>
            </div>
            <form onSubmit={handleCustomerSubmit} className="p-6 space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-gray-500 uppercase mb-1">Razón Social Cliente *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Importadora Farmaceútica Ltda."
                    value={cName}
                    onChange={(e) => setCName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-550 uppercase mb-1">Registro Fiscal (RUT/RUC/NIT) *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., RUT-990812-B6"
                    value={cTax}
                    onChange={(e) => setCTax(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 uppercase mb-1">Límite de Crédito Concedido ({currencySymbol}) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="E.g., 20000"
                    value={cCredit}
                    onChange={(e) => setCCredit(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-500 uppercase mb-1">Contacto / Email</label>
                  <input
                    type="email"
                    placeholder="E.g., info@importacionesf.com"
                    value={cEmail}
                    onChange={(e) => setCEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-500 uppercase mb-1">Teléfono Despachos</label>
                  <input
                    type="text"
                    placeholder="E.g., +57 (602) 441-2000"
                    value={cPhone}
                    onChange={(e) => setCPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-500 uppercase mb-1">Dirección de Despacho Comercial</label>
                  <input
                    type="text"
                    placeholder="E.g., Km 12 Vía Cali-Yumbo, Parque Logístico"
                    value={cAddr}
                    onChange={(e) => setCAddr(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3.5 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setShowAddCustomerModal(false); setShowEditCustomerModal(false); }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer transition-colors shadow-md shadow-indigo-600/10"
                >
                  Confirmar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

