import React, { useState } from 'react';
import {
  X,
  Settings,
  Building,
  DollarSign,
  Printer,
  Download,
  Upload,
  RefreshCw,
  Check,
  Shield,
} from 'lucide-react';
import { CompanySettings, Loan } from '../types';
import { DEFAULT_COMPANY_SETTINGS } from '../utils/storage';
import { saveLoanToFirebase, saveSettingsToFirebase } from '../utils/firebaseStorage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CompanySettings;
  onSaveSettings: (newSettings: CompanySettings) => void;
  allLoans: Loan[];
  onReloadLoans: (newLoans: Loan[]) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  allLoans,
  onReloadLoans,
}) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState<CompanySettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleExportJSON = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      companySettings: formData,
      loans: allLoans,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-prestamos-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.loans && Array.isArray(parsed.loans)) {
          // Save to Firebase
          for (const loan of parsed.loans) {
            await saveLoanToFirebase(loan);
          }
          onReloadLoans(parsed.loans);
          if (parsed.companySettings) {
            await saveSettingsToFirebase(parsed.companySettings);
            onSaveSettings(parsed.companySettings);
          }
          alert('¡Copia de seguridad restaurada con éxito en la nube!');
          onClose();
        } else {
          alert('Archivo de copia no válido');
        }
      } catch (err) {
        alert('Error al leer el archivo JSON');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-lg">Configuración de la Financiera & Parámetros</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Company identity */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
              <Building className="w-4 h-4 text-blue-600" />
              <span>Identidad del Negocio y Logotipo</span>
            </h4>

            {/* Brand Logo & Favicon Preview */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white p-1 rounded-xl border border-slate-200 shadow-xs flex items-center justify-center shrink-0">
                  <img
                    src={formData.logoUrl || '/logo.svg'}
                    alt="Logo preview"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Logotipo Institucional</p>
                  <p className="text-[11px] text-slate-500">Préstamos Fácil · Crédito Rápido y Sencillo</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, logoUrl: '/logo.svg' })}
                className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100/60 rounded-lg transition-colors border border-blue-200 bg-white"
              >
                Restablecer Logo
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Comercial</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">RUC / RFC / Identificación Fiscal</label>
                <input
                  type="text"
                  value={formData.legalId}
                  onChange={(e) => setFormData({ ...formData, legalId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono de Contacto</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dirección Física</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>
            </div>
          </div>

          {/* Financial defaults */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Moneda y Tasas por Defecto</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Símbolo</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                >
                  <option value="$">$ (Pesos / Dólares)</option>
                  <option value="€">€ (Euros)</option>
                  <option value="S/.">S/. (Soles Perú)</option>
                  <option value="Bs.">Bs. (Bolivianos)</option>
                  <option value="Q">Q (Quetzales)</option>
                  <option value="₡">₡ (Colones)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">TNA Anual (%)</label>
                <input
                  type="number"
                  step="1"
                  value={formData.defaultAnnualRate}
                  onChange={(e) => setFormData({ ...formData, defaultAnnualRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mora Diaria (%)</label>
                <input
                  type="number"
                  step="0.05"
                  value={formData.defaultLateRateDaily}
                  onChange={(e) => setFormData({ ...formData, defaultLateRateDaily: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Días Gracia</label>
                <input
                  type="number"
                  min="0"
                  value={formData.defaultGraceDays}
                  onChange={(e) => setFormData({ ...formData, defaultGraceDays: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>
            </div>
          </div>

          {/* Ticket Header & Footer Notes */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
              <Printer className="w-4 h-4 text-indigo-600" />
              <span>Personalización de Documentos (A4)</span>
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mensaje de Pie de Ticket</label>
              <input
                type="text"
                value={formData.ticketFooter}
                onChange={(e) => setFormData({ ...formData, ticketFooter: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Leyenda Legal / Términos de Aclaración</label>
              <input
                type="text"
                value={formData.ticketNotice}
                onChange={(e) => setFormData({ ...formData, ticketNotice: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Backup and Data Tools */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Respaldo y Gestión de Datos
            </h4>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExportJSON}
                className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar Copia de Seguridad (JSON)</span>
              </button>

              <label className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Restaurar Copia</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Bottom actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>¡Guardado!</span>
                </>
              ) : (
                <span>Guardar Configuración</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
