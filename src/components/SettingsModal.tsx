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
  FileSpreadsheet,
  ExternalLink,
} from 'lucide-react';
import { CompanySettings, Loan } from '../types';
import { DEFAULT_COMPANY_SETTINGS, saveCompanySettings, saveLoans } from '../utils/storage';

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
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.loans && Array.isArray(parsed.loans)) {
          saveLoans(parsed.loans);
          onReloadLoans(parsed.loans);
          if (parsed.companySettings) {
            saveCompanySettings(parsed.companySettings);
            onSaveSettings(parsed.companySettings);
          }
          alert('¡Copia de seguridad restaurada con éxito!');
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
              <span>Identidad del Negocio / Financiera</span>
            </h4>

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
              <span>Personalización de Tickets Térmicos</span>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Leyenda Legal / Aviso Oficial</label>
              <input
                type="text"
                value={formData.ticketNotice}
                onChange={(e) => setFormData({ ...formData, ticketNotice: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Google Sheets Integration in Settings */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Sincronización en la Nube con Google Sheets</span>
            </h4>

            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950">
                  {formData.googleSheets?.spreadsheetId ? 'Hoja Conectada' : 'No conectada a Google Drive'}
                </span>
                {formData.googleSheets?.spreadsheetUrl && (
                  <a
                    href={formData.googleSheets.spreadsheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-bold text-emerald-700 hover:underline inline-flex items-center space-x-1"
                  >
                    <span>Ver en Drive</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {formData.googleSheets?.userEmail && (
                <p className="text-[11px] text-emerald-800">
                  Cuenta activa: <strong>{formData.googleSheets.userEmail}</strong>
                </p>
              )}

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="text-[11px] font-medium text-slate-700">Auto-sincronizar cambios:</label>
                <input
                  type="checkbox"
                  checked={formData.googleSheets?.autoSync ?? true}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      googleSheets: {
                        ...(formData.googleSheets || { autoSync: true }),
                        autoSync: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
              </div>
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
