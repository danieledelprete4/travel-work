import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function ImportExport({ month, year }) {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleImportCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(`${API}/import/csv`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      toast.success(`Import completato! ${response.data.imported} giornate importate, ${response.data.skipped} ignorate`);
    } catch (error) {
      console.error("Error importing CSV:", error);
      toast.error(error.response?.data?.detail || "Errore durante l'import");
    } finally {
      setImporting(false);
      e.target.value = ""; // Reset input
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const response = await axios.get(`${API}/export/pdf`, {
        params: { month: month.toString(), year: year.toString() },
        responseType: "blob"
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `report_${month}_${year}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("Report PDF scaricato con successo!");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Errore durante l'export del PDF");
    } finally {
      setExporting(false);
    }
  };

  const monthNames = [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
  ];

  return (
    <div className="space-y-6">
      {/* Import CSV */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Importa Dati CSV</h2>
            <p className="text-sm text-slate-600">Carica il tuo file Excel/CSV per importare le giornate</p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-6 mb-4">
          <h3 className="font-semibold text-slate-700 mb-2">Formato File</h3>
          <p className="text-sm text-slate-600 mb-3">
            Il file CSV deve contenere le seguenti colonne:
          </p>
          <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
            <li><code className="bg-white px-2 py-0.5 rounded text-xs">Giorno</code> - Data (formato DD/MM/YYYY)</li>
            <li><code className="bg-white px-2 py-0.5 rounded text-xs">Città</code> - Nome della città di destinazione</li>
            <li><code className="bg-white px-2 py-0.5 rounded text-xs">Stato Giornata</code> - Per giorni di riposo (es: "- Riposo -")</li>
          </ul>
        </div>

        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {importing ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-sm text-slate-600">Importazione in corso...</p>
                </div>
              ) : (
                <>
                  <svg className="w-12 h-12 mb-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mb-2 text-sm text-slate-700">
                    <span className="font-semibold">Clicca per caricare</span> o trascina qui
                  </p>
                  <p className="text-xs text-slate-500">File CSV (max 10MB)</p>
                </>
              )}
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              disabled={importing}
              data-testid="csv-import-input"
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Export PDF */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-12" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Esporta Report PDF</h2>
            <p className="text-sm text-slate-600">Scarica il report mensile in formato PDF</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 mb-4">
          <h3 className="font-semibold text-slate-800 mb-2">Report Mensile</h3>
          <p className="text-sm text-slate-700 mb-3">
            Il report include:
          </p>
          <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
            <li>Statistiche mensili complete (KM, benzina, costi)</li>
            <li>Dettaglio giornaliero con orari e destinazioni</li>
            <li>Confronto con rimborso forfettario</li>
            <li>Formato professionale pronto per invio HR</li>
          </ul>
        </div>

        <div className="flex items-center justify-between bg-slate-50 rounded-lg p-4">
          <div>
            <p className="text-sm font-medium text-slate-700">Report selezionato:</p>
            <p className="text-lg font-bold text-slate-800">{monthNames[month - 1]} {year}</p>
          </div>
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            data-testid="export-pdf-btn"
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {exporting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Generazione...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Scarica PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Suggerimento</h3>
            <p className="mt-1 text-sm text-blue-700">
              Esporta il report PDF alla fine di ogni mese e invialo all'ufficio risorse umane per la gestione dei rimborsi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImportExport;