import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function WorkDayModal({ date, workDay, locations, settings, onClose }) {
  const [type, setType] = useState(workDay?.status ? "rest" : "work");
  const [selectedCity, setSelectedCity] = useState(workDay?.city || "");
  const [status, setStatus] = useState(workDay?.status || "Riposo");
  const [loading, setLoading] = useState(false);
  
  // NUOVO: Città personalizzata
  const [isCustomCity, setIsCustomCity] = useState(workDay?.is_custom_city || false);
  const [customCityName, setCustomCityName] = useState(workDay?.custom_city_name || "");
  const [customDistanceKm, setCustomDistanceKm] = useState(workDay?.custom_distance_km || "");
  const [customTravelMinutes, setCustomTravelMinutes] = useState(workDay?.custom_travel_minutes || "");
  
  // Timbrature reali
  const [actualArrival, setActualArrival] = useState(workDay?.actual_arrival_at_store || "");
  const [actualExit, setActualExit] = useState(workDay?.actual_exit_from_store || "");
  const [actualReturn, setActualReturn] = useState(workDay?.actual_return_home || "");
  const [showActuals, setShowActuals] = useState(false);

  useEffect(() => {
    if (workDay?.is_custom_city) {
      setIsCustomCity(true);
      setCustomCityName(workDay.custom_city_name || "");
      setCustomDistanceKm(workDay.custom_distance_km || "");
      setCustomTravelMinutes(workDay.custom_travel_minutes || "");
    }
  }, [workDay]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        date: date,
        actual_arrival_at_store: actualArrival || null,
        actual_exit_from_store: actualExit || null,
        actual_return_home: actualReturn || null
      };

      if (type === "work") {
        if (isCustomCity) {
          // Città personalizzata
          if (!customCityName || !customDistanceKm || !customTravelMinutes) {
            toast.error("Compila tutti i campi per la città personalizzata");
            setLoading(false);
            return;
          }
          payload.is_custom_city = true;
          payload.custom_city_name = customCityName;
          payload.custom_distance_km = parseFloat(customDistanceKm);
          payload.custom_travel_minutes = parseInt(customTravelMinutes);
          payload.city = null;
          payload.status = null;
        } else {
          // Città standard
          if (!selectedCity) {
            toast.error("Seleziona una città");
            setLoading(false);
            return;
          }
          payload.city = selectedCity;
          payload.status = null;
          payload.is_custom_city = false;
        }
      } else {
        // Giorno di riposo
        payload.city = null;
        payload.status = status;
        payload.is_custom_city = false;
      }

      if (workDay) {
        // Update existing
        const encodedDate = encodeURIComponent(date);
        await axios.put(`${API}/workdays/${encodedDate}`, payload);
        toast.success("Giornata aggiornata con successo");
      } else {
        // Create new
        await axios.post(`${API}/workdays`, payload);
        toast.success("Giornata creata con successo");
      }

      onClose();
    } catch (error) {
      console.error("Error saving workday:", error);
      toast.error(error.response?.data?.detail || "Errore nel salvataggio");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Sei sicuro di voler eliminare questa giornata?")) {
      return;
    }

    setLoading(true);
    try {
      await axios.delete(`${API}/workdays`, {
        params: { date: date }
      });
      toast.success("Giornata eliminata");
      onClose();
    } catch (error) {
      console.error("Error deleting workday:", error);
      toast.error(error.response?.data?.detail || "Errore nell'eliminazione");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sm:p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold" data-testid="modal-title">
                {workDay ? "Modifica Giornata" : "Nuova Giornata"}
              </h2>
              <p className="text-blue-100 mt-1 text-sm sm:text-base">{date}</p>
            </div>
            <button
              onClick={onClose}
              data-testid="modal-close-btn"
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
              aria-label="Chiudi"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Tipo Giornata
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setType("work")}
                data-testid="type-work-btn"
                className={`p-4 rounded-lg border-2 transition-all ${
                  type === "work"
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-200 hover:border-slate-300 text-slate-600"
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">Giorno Lavorativo</span>
                </div>
              </button>
              
              <button
                onClick={() => setType("rest")}
                data-testid="type-rest-btn"
                className={`p-4 rounded-lg border-2 transition-all ${
                  type === "rest"
                    ? "border-green-600 bg-green-50 text-green-700"
                    : "border-slate-200 hover:border-slate-300 text-slate-600"
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className="font-medium">Riposo/Festivo</span>
                </div>
              </button>
            </div>
          </div>

          {/* Work Day - City Selection */}
          {type === "work" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Scegli Tipo Città
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setIsCustomCity(false)}
                    data-testid="standard-city-btn"
                    className={`p-3 rounded-lg border-2 transition-all ${
                      !isCustomCity
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-slate-200 hover:border-slate-300 text-slate-600"
                    }`}
                  >
                    <span className="font-medium">📍 Città Standard</span>
                  </button>
                  
                  <button
                    onClick={() => setIsCustomCity(true)}
                    data-testid="custom-city-btn"
                    className={`p-3 rounded-lg border-2 transition-all ${
                      isCustomCity
                        ? "border-orange-600 bg-orange-50 text-orange-700"
                        : "border-slate-200 hover:border-slate-300 text-slate-600"
                    }`}
                  >
                    <span className="font-medium">🗺️ Città Personalizzata</span>
                  </button>
                </div>
              </div>

              {!isCustomCity ? (
                /* Standard City Selection */
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Città MediaWorld
                  </label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    data-testid="city-select"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleziona città...</option>
                    {locations && locations.map((loc) => (
                      <option key={loc.id} value={loc.city_name}>
                        {loc.city_name} - {loc.distance_km} km ({loc.travel_time_minutes} min)
                      </option>
                    ))}
                  </select>

                  {selectedCity && locations && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      {(() => {
                        const loc = locations.find(l => l.city_name === selectedCity);
                        if (!loc) return null;
                        
                        const travelTime = loc.travel_time_minutes;
                        const distance = loc.distance_km;
                        const paidTravel = Math.max(0, travelTime - 30) * 2;
                        const storeTime = (540 - paidTravel) + (settings?.extra_tolerance_minutes || 15);
                        
                        return (
                          <div className="text-sm text-blue-800 space-y-1">
                            <p><strong>📍 Distanza:</strong> {distance} km (A/R: {distance * 2} km)</p>
                            <p><strong>⏱️ Viaggio:</strong> {travelTime} min andata + {travelTime} min ritorno</p>
                            <p><strong>💼 Tempo in negozio:</strong> ~{Math.floor(storeTime / 60)}h {storeTime % 60}min</p>
                            <p className="text-xs mt-2 text-blue-600">Primi 30 min andata/ritorno non pagati</p>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              ) : (
                /* Custom City Fields */
                <div className="space-y-4">
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm text-orange-800">
                      ℹ️ Inserisci i dati manualmente per città non in elenco (es. Vicenza)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Nome Città
                    </label>
                    <input
                      type="text"
                      value={customCityName}
                      onChange={(e) => setCustomCityName(e.target.value)}
                      data-testid="custom-city-name"
                      placeholder="Es: Vicenza"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Distanza (KM)
                      </label>
                      <input
                        type="number"
                        value={customDistanceKm}
                        onChange={(e) => setCustomDistanceKm(e.target.value)}
                        data-testid="custom-distance-km"
                        placeholder="Es: 45"
                        min="0"
                        step="0.1"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Minuti Viaggio
                      </label>
                      <input
                        type="number"
                        value={customTravelMinutes}
                        onChange={(e) => setCustomTravelMinutes(e.target.value)}
                        data-testid="custom-travel-minutes"
                        placeholder="Es: 50"
                        min="0"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {customDistanceKm && customTravelMinutes && settings && (
                    <div className="p-3 bg-orange-50 rounded-lg">
                      {(() => {
                        const distance = parseFloat(customDistanceKm);
                        const travelTime = parseInt(customTravelMinutes);
                        const paidTravel = Math.max(0, travelTime - 30) * 2;
                        const storeTime = (540 - paidTravel) + (settings?.extra_tolerance_minutes || 15);
                        
                        return (
                          <div className="text-sm text-orange-800 space-y-1">
                            <p><strong>📍 Distanza A/R:</strong> {distance * 2} km</p>
                            <p><strong>⏱️ Viaggio totale:</strong> {travelTime * 2} min</p>
                            <p><strong>💼 Tempo in negozio:</strong> ~{Math.floor(storeTime / 60)}h {storeTime % 60}min</p>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* Timbrature Reali (Optional) */}
              <div>
                <button
                  onClick={() => setShowActuals(!showActuals)}
                  data-testid="toggle-actuals-btn"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                >
                  <span>{showActuals ? "▼" : "▶"} Aggiungi timbrature reali (opzionale)</span>
                </button>

                {showActuals && (
                  <div className="mt-3 space-y-3 p-4 bg-slate-50 rounded-lg">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Arrivo Negozio
                        </label>
                        <input
                          type="time"
                          value={actualArrival}
                          onChange={(e) => setActualArrival(e.target.value)}
                          data-testid="actual-arrival"
                          className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Uscita Negozio
                        </label>
                        <input
                          type="time"
                          value={actualExit}
                          onChange={(e) => setActualExit(e.target.value)}
                          data-testid="actual-exit"
                          className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Rientro Casa
                        </label>
                        <input
                          type="time"
                          value={actualReturn}
                          onChange={(e) => setActualReturn(e.target.value)}
                          data-testid="actual-return"
                          className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rest Day - Status */}
          {type === "rest" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tipo Riposo
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                data-testid="status-select"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="Riposo">Riposo</option>
                <option value="Festivo">Festivo</option>
                <option value="Compleanno">Compleanno</option>
                <option value="Riunione">Riunione</option>
                <option value="Ferie">Ferie</option>
                <option value="Malattia">Malattia</option>
              </select>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-slate-200">
            {workDay && (
              <button
                onClick={handleDelete}
                disabled={loading}
                data-testid="delete-workday-btn"
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🗑️ Elimina
              </button>
            )}
            
            <div className="flex-1 flex space-x-3">
              <button
                onClick={onClose}
                disabled={loading}
                data-testid="cancel-btn"
                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Annulla
              </button>
              
              <button
                onClick={handleSave}
                disabled={loading}
                data-testid="save-workday-btn"
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Salvataggio..." : "Salva"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkDayModal;
