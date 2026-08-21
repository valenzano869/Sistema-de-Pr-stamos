import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Download,
  Lock,
  Zap,
  Layers,
  ArrowRight,
  Database,
} from 'lucide-react';
import { CompanySettings, Loan, GoogleSheetsConfig } from '../types';
import {
  createGoogleSpreadsheet,
  exportLoansToCSV,
  fetchGoogleUserInfo,
  requestGoogleAccessToken,
  syncLoansToSpreadsheet,
  extractSpreadsheetId,
  DEFAULT_SPREADSHEET_ID,
  DEFAULT_SPREADSHEET_URL,
} from '../utils/googleSheets';

interface GoogleSheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  loans: Loan[];
  companySettings: CompanySettings;
  onUpdateSettings: (settings: CompanySettings) => void;
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({
  isOpen,
  onClose,
  loans,
  companySettings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const currentSheetsConfig: GoogleSheetsConfig = companySettings.googleSheets || {
    spreadsheetId: DEFAULT_SPREADSHEET_ID,
    spreadsheetUrl: DEFAULT_SPREADSHEET_URL,
    spreadsheetTitle: 'Cartera de Préstamos Google Sheets',
    autoSync: true,
  };

  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [customSheetId, setCustomSheetId] = useState(
    currentSheetsConfig.spreadsheetId || DEFAULT_SPREADSHEET_ID
  );
  const [autoSync, setAutoSync] = useState(currentSheetsConfig.autoSync ?? true);
  const [syncSuccessDetails, setSyncSuccessDetails] = useState<{
    loansCount: number;
    installmentsCount: number;
    paymentsCount: number;
    syncedAt: string;
  } | null>(null);

  const handleConnectAndCreate = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage('Solicitando autorización segura de Google...');

    try {
      // 1. Get OAuth Access Token
      const { accessToken, expiresIn } = await requestGoogleAccessToken();
      const userInfo = await fetchGoogleUserInfo(accessToken);

      setStatusMessage('Creando hoja de cálculo estructurada en Google Drive...');
      const sheetTitle = `Cartera de Préstamos - ${companySettings.name || 'Financiera'}`;
      const { spreadsheetId, spreadsheetUrl } = await createGoogleSpreadsheet(sheetTitle, accessToken);

      setStatusMessage('Sincronizando préstamos, cuotas y cobros...');
      const result = await syncLoansToSpreadsheet(loans, companySettings, spreadsheetId, accessToken);

      const updatedConfig: GoogleSheetsConfig = {
        spreadsheetId,
        spreadsheetUrl,
        spreadsheetTitle: sheetTitle,
        autoSync,
        lastSyncedAt: result.syncedAt,
        accessToken,
        tokenExpiresAt: Date.now() + expiresIn * 1000,
        userEmail: userInfo.email,
        userName: userInfo.name,
      };

      onUpdateSettings({
        ...companySettings,
        googleSheets: updatedConfig,
      });

      setSyncSuccessDetails({
        loansCount: result.syncedLoansCount,
        installmentsCount: result.syncedInstallmentsCount,
        paymentsCount: result.syncedPaymentsCount,
        syncedAt: result.syncedAt,
      });

      setStatusMessage('¡Hoja creada y sincronizada con éxito!');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error al conectar con Google Sheets');
      setStatusMessage(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncNow = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage('Verificando acceso a Google Sheets...');

    try {
      let token = currentSheetsConfig.accessToken;
      const isExpired = !currentSheetsConfig.tokenExpiresAt || Date.now() > currentSheetsConfig.tokenExpiresAt - 60000;

      if (!token || isExpired) {
        setStatusMessage('Renovando autorización con Google...');
        const tokenRes = await requestGoogleAccessToken();
        token = tokenRes.accessToken;
        const userInfo = await fetchGoogleUserInfo(token);

        currentSheetsConfig.accessToken = token;
        currentSheetsConfig.tokenExpiresAt = Date.now() + tokenRes.expiresIn * 1000;
        if (userInfo.email) currentSheetsConfig.userEmail = userInfo.email;
      }

      const targetSheetId = extractSpreadsheetId(customSheetId.trim() || currentSheetsConfig.spreadsheetId || DEFAULT_SPREADSHEET_ID);

      if (!targetSheetId) {
        throw new Error('No hay una hoja de cálculo configurada. Ingrese el ID o enlace de la hoja.');
      }

      setStatusMessage('Sincronizando cartera y cobros en tiempo real...');
      const result = await syncLoansToSpreadsheet(loans, companySettings, targetSheetId, token);

      const updatedConfig: GoogleSheetsConfig = {
        ...currentSheetsConfig,
        spreadsheetId: targetSheetId,
        spreadsheetUrl: result.spreadsheetUrl,
        autoSync,
        lastSyncedAt: result.syncedAt,
      };

      onUpdateSettings({
        ...companySettings,
        googleSheets: updatedConfig,
      });

      setSyncSuccessDetails({
        loansCount: result.syncedLoansCount,
        installmentsCount: result.syncedInstallmentsCount,
        paymentsCount: result.syncedPaymentsCount,
        syncedAt: result.syncedAt,
      });

      setStatusMessage('¡Sincronización completada exitosamente!');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error durante la sincronización');
      setStatusMessage(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    const csvContent = exportLoansToCSV(loans, companySettings);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Cartera_Prestamos_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSavePreferences = () => {
    const cleanId = extractSpreadsheetId(customSheetId.trim() || currentSheetsConfig.spreadsheetId || DEFAULT_SPREADSHEET_ID);
    onUpdateSettings({
      ...companySettings,
      googleSheets: {
        ...currentSheetsConfig,
        autoSync,
        spreadsheetId: cleanId,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${cleanId}/edit`,
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/80 flex items-center justify-center shadow-inner">
              <FileSpreadsheet className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Integración con Google Sheets</h3>
              <p className="text-xs text-emerald-200">Sincronización en tiempo real de Préstamos, Cuotas y Recibos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-300 hover:text-white hover:bg-emerald-800 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Status banner */}
          {currentSheetsConfig.spreadsheetId ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Hoja de Cálculo Conectada
                  </span>
                  <p className="text-sm font-bold text-slate-900">
                    {currentSheetsConfig.spreadsheetTitle || 'Cartera de Préstamos'}
                  </p>
                  {currentSheetsConfig.userEmail && (
                    <p className="text-[11px] text-slate-500">Cuenta: {currentSheetsConfig.userEmail}</p>
                  )}
                  {currentSheetsConfig.lastSyncedAt && (
                    <p className="text-[10px] text-emerald-700 mt-0.5">
                      Última sincronización: {new Date(currentSheetsConfig.lastSyncedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {currentSheetsConfig.spreadsheetUrl && (
                  <a
                    href={currentSheetsConfig.spreadsheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    <span>Abrir Hoja</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900 space-y-1">
                <p className="font-bold text-sm">Crea tu Libro de Préstamos en Google Drive</p>
                <p className="text-blue-700">
                  Al conectar, crearemos automáticamente una hoja de cálculo en tu Google Drive organizada con 3
                  pestañas: <strong>Préstamos Activos</strong>, <strong>Plan de Cuotas</strong> y{' '}
                  <strong>Libro de Cobros</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Sheets Structure preview cards */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Estructura de las 3 Pestañas en tu Google Sheet</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="font-bold text-blue-900 flex items-center space-x-1">
                  <span>📋</span>
                  <span>1. Préstamos</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Código, cliente, DNI, teléfono, capital, TNA %, plazo, total a pagar, pagado, saldo y estado.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="font-bold text-emerald-900 flex items-center space-x-1">
                  <span>📅</span>
                  <span>2. Plan de Cuotas</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Cuota a cuota, vencimientos, capital, interés, días de retraso, mora calculada y fecha de pago.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="font-bold text-amber-900 flex items-center space-x-1">
                  <span>🧾</span>
                  <span>3. Libro de Cobros</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Tickets emitidos, fecha/hora, método de pago, desglose de capital/interés/mora y saldo resultante.
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Acciones de Sincronización</h4>

            <div className="flex flex-wrap gap-3">
              {!currentSheetsConfig.spreadsheetId ? (
                <button
                  type="button"
                  onClick={handleConnectAndCreate}
                  disabled={isLoading}
                  className="flex-1 inline-flex items-center justify-center space-x-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Conectando con Google...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Crear Nueva Hoja en Google Drive y Sincronizar</span>
                    </>
                  )}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSyncNow}
                    disabled={isLoading}
                    className="flex-1 inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sincronizando...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        <span>Sincronizar Todo Ahora ({loans.length} Préstamos)</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleConnectAndCreate}
                    disabled={isLoading}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                    title="Crear una hoja de cálculo nueva"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Crear Otra Hoja</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={handleDownloadCSV}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                title="Descargar copia en CSV/Excel"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar CSV</span>
              </button>
            </div>

            {/* Auto sync switch */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl mt-3">
              <div>
                <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Sincronización Automática en Segundo Plano</span>
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Actualiza Google Sheets automáticamente al originar préstamos o registrar cobros.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Manual Sheet ID configuration */}
            <div className="pt-2 space-y-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  ID de Google Spreadsheet (Opcional si deseas vincular una hoja existente):
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Ej: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                    value={customSheetId}
                    onChange={(e) => setCustomSheetId(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  El ID se encuentra en la URL de tu hoja entre <code>/d/</code> y <code>/edit</code>.
                </p>
              </div>
            </div>
          </div>

          {/* Feedback logs */}
          {statusMessage && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {syncSuccessDetails && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
              <div className="font-bold flex items-center space-x-1.5 text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Datos sincronizados con éxito:</span>
              </div>
              <ul className="list-disc list-inside text-[11px] text-emerald-700 pl-2 space-y-0.5">
                <li>{syncSuccessDetails.loansCount} Préstamos registrados en pestaña 1</li>
                <li>{syncSuccessDetails.installmentsCount} Cuotas de amortización en pestaña 2</li>
                <li>{syncSuccessDetails.paymentsCount} Recibos de cobro en pestaña 3</li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold"
          >
            Cerrar
          </button>

          <button
            type="button"
            onClick={handleSavePreferences}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
          >
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  );
};
