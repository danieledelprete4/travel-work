import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function SettingsPage({ settings, onSettingsUpdate }) {
  const [fuelPrice, setFuelPrice] = useState("");
  const [consumption, setConsumption] = useState("");
  const [allowance, setAllowance] = useState("");
  const [carModel, setCarModel] = useState("");
  const [tolerance, setTolerance] = useState("");
  const [googleMapsKey, setGoogleMapsKey] = useState("");
  const [googleOAuthClientId, setGoogleOAuthClientId] = useState("");
  const [saving, setSaving] = useState(false);
  
  // Locations management
  const [locations, setLocations] = useState([]);
  const [showAddCity, setShowAddCity] = useState(false);
  const [newCity, setNewCity] = useState({
    city_name: "",
    distance_km: "",
    travel_time_minutes: "",
    address: "",
    default_arrival_time: "10:00"
  });
  const [editingCity, setEditingCity] = useState(null);

  useEffect(() => {
    if (settings) {
      setFuelPrice(settings.fuel_price_per_liter.toString());
      setConsumption(settings.car_consumption_per_100km.toString());
      setAllowance(settings.monthly_allowance.toString());
      setCarModel(settings.car_model || "Hyundai IONIQ 1.6 Hybrid 2017");
      setTolerance(settings.extra_tolerance_minutes?.toString() || "15");
      setGoogleMapsKey(settings.google_maps_api_key || "");
      setGoogleOAuthClientId(settings.google_oauth_client_id || "");
    }
    loadLocations();
  }, [settings]);

  const loadLocations = async () => {
    try {
      const response = await axios.get(`${API}/locations`);
      setLocations(response.data);
    } catch (error) {
      console.error("Error loading locations:", error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        id: settings?.id || "",
        fuel_price_per_liter: parseFloat(fuelPrice),
        car_consumption_per_100km: parseFloat(consumption),
        monthly_allowance: parseFloat(allowance),
        car_model: carModel,
        extra_tolerance_minutes: parseInt(tolerance),
        google_maps_api_key: googleMapsKey || null,
        google_oauth_client_id: googleOAuthClientId || null
      };

      await axios.put(`${API}/settings`, payload);
      toast.success("Impostazioni salvate con successo!");
      onSettingsUpdate();
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Errore nel salvataggio delle impostazioni");
    } finally {
      setSaving(false);
    }
  };

  const handleAddCity = async () => {
    if (!newCity.city_name || !newCity.distance_km || !newCity.travel_time_minutes) {
      toast.error("Compila tutti i campi obbligatori");
      return;
    }

    try {
      await axios.post(`${API}/locations`, {
        id: "",
        city_name: newCity.city_name,
        distance_km: parseFloat(newCity.distance_km),
        travel_time_minutes: parseInt(newCity.travel_time_minutes),
        address: newCity.address,
        default_arrival_time: newCity.default_arrival_time
      });
      
      toast.success("Città aggiunta con successo!");
      setShowAddCity(false);
      setNewCity({ city_name: "", distance_km: "", travel_time_minutes: "", address: "", default_arrival_time: "10:00" });
      loadLocations();
    } catch (error) {
      console.error("Error adding city:", error);
      toast.error(error.response?.data?.detail || "Errore nell'aggiunta della città");
    }
  };

  const handleUpdateCity = async (oldName) => {
    if (!editingCity) return;

    try {
      await axios.put(`${API}/locations/${oldName}`, editingCity);
      toast.success("Città aggiornata con successo!");
      setEditingCity(null);
      loadLocations();
    } catch (error) {
      console.error("Error updating city:", error);
      toast.error(error.response?.data?.detail || "Errore nell'aggiornamento della città");
    }
  };

  const handleDeleteCity = async (cityName) => {
    if (!window.confirm(`Sei sicuro di voler eliminare ${cityName}?`)) {
      return;
    }

    try {
      await axios.delete(`${API}/locations/${cityName}`);
      toast.success("Città eliminata con successo!");
      loadLocations();
    } catch (error) {
      console.error("Error deleting city:", error);
      toast.error(error.response?.data?.detail || "Errore nell'eliminazione della città");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* General Settings */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Impostazioni Generali</h2>
            <p className="text-xs sm:text-sm text-slate-600">Configura i parametri dell'applicazione</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Car Info */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Modello Auto
            </label>
            <input
              type="text"
              value={carModel}
              onChange={(e) => setCarModel(e.target.value)}
              data-testid="car-model-input"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="es: Hyundai IONIQ 1.6 Hybrid 2017"
            />
            <p className="mt-1 text-xs text-slate-500">Modello del veicolo utilizzato</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Fuel Price */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Prezzo Benzina (€/litro)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={fuelPrice}
                  onChange={(e) => setFuelPrice(e.target.value)}
                  data-testid="fuel-price-input"
                  className="w-full px-4 py-3 pl-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="1.75"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-slate-500">€</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-slate-500">Per calcoli informativi</p>
            </div>

            {/* Car Consumption */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Consumo Auto (L/100km)
              </label>
              <input
                type="number"
                step="0.1"
                value={consumption}
                onChange={(e) => setConsumption(e.target.value)}
                data-testid="consumption-input"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="4.5"
              />
              <p className="mt-1 text-xs text-slate-500">Consumo medio del veicolo</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Monthly Allowance */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Rimborso Usura KM Mensile (€)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  value={allowance}
                  onChange={(e) => setAllowance(e.target.value)}
                  data-testid="allowance-input"
                  className="w-full px-4 py-3 pl-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="250"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-slate-500">€</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-slate-500">Rimborso forfettario per usura chilometrica</p>
            </div>

            {/* Extra Tolerance */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tolleranza Extra (minuti)
              </label>
              <input
                type="number"
                min="0"
                max="60"
                step="1"
                value={tolerance}
                onChange={(e) => setTolerance(e.target.value)}
                data-testid="tolerance-input"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="15"
              />
              <p className="mt-1 text-xs text-slate-500">
                Tempo extra per sicurezza (0-60 min, default: 15)
              </p>
            </div>
          </div>

          {/* Google Maps API Key */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Google Maps API Key (Opzionale)
            </label>
            <input
              type="text"
              value={googleMapsKey}
              onChange={(e) => setGoogleMapsKey(e.target.value)}
              data-testid="google-maps-key-input"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
              placeholder="AIzaSy..."
            />
            <p className="mt-1 text-xs text-slate-500">
              Per calcoli automatici distanze/tempi. <strong>Non ancora implementato.</strong>
            </p>
          </div>

          {/* Google OAuth Client ID */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Google OAuth Client ID (Multi-utente)
            </label>
            <input
              type="text"
              value={googleOAuthClientId}
              onChange={(e) => setGoogleOAuthClientId(e.target.value)}
              data-testid="google-oauth-client-id-input"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm font-mono"
              placeholder="123456789-abc.apps.googleusercontent.com"
            />
            <p className="mt-1 text-xs text-slate-500">
              Per abilitare login Google e gestione multi-utente. <strong>Configurazione in corso.</strong>
            </p>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-slate-200">
            <button
              onClick={handleSave}
              disabled={saving}
              data-testid="save-settings-btn"
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Salvataggio...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Salva Impostazioni</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Cities Management */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Gestione Città</h2>
              <p className="text-xs sm:text-sm text-slate-600">Aggiungi o modifica le destinazioni</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddCity(!showAddCity)}
            data-testid="add-city-btn"
            className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center space-x-2 text-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="hidden sm:inline">Aggiungi</span>
          </button>
        </div>

        {/* Add City Form */}
        {showAddCity && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-slate-800 mb-4 text-sm sm:text-base">Nuova Città</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Città *</label>
                <input
                  type="text"
                  value={newCity.city_name}
                  onChange={(e) => setNewCity({...newCity, city_name: e.target.value})}
                  data-testid="new-city-name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                  placeholder="es: Milano"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Distanza (km) *</label>
                <input
                  type="number"
                  value={newCity.distance_km}
                  onChange={(e) => setNewCity({...newCity, distance_km: e.target.value})}
                  data-testid="new-city-distance"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                  placeholder="es: 150"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tempo Viaggio (min) *</label>
                <input
                  type="number"
                  value={newCity.travel_time_minutes}
                  onChange={(e) => setNewCity({...newCity, travel_time_minutes: e.target.value})}
                  data-testid="new-city-time"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                  placeholder="es: 90"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Orario Arrivo Standard *</label>
                <input
                  type="time"
                  value={newCity.default_arrival_time}
                  onChange={(e) => setNewCity({...newCity, default_arrival_time: e.target.value})}
                  data-testid="new-city-arrival-time"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Indirizzo</label>
                <input
                  type="text"
                  value={newCity.address}
                  onChange={(e) => setNewCity({...newCity, address: e.target.value})}
                  data-testid="new-city-address"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                  placeholder="es: MediaWorld Milano"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowAddCity(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm"
              >
                Annulla
              </button>
              <button
                onClick={handleAddCity}
                data-testid="save-new-city-btn"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                Salva Città
              </button>
            </div>
          </div>
        )}

        {/* Cities List */}
        <div className="space-y-3">
          {locations.filter(loc => loc.city_name !== "Verona").map((location) => (
            <div key={location.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
              {editingCity?.city_name === location.city_name ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Distanza (km)</label>
                      <input
                        type="number"
                        value={editingCity.distance_km}
                        onChange={(e) => setEditingCity({...editingCity, distance_km: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Tempo (min)</label>
                      <input
                        type="number"
                        value={editingCity.travel_time_minutes}
                        onChange={(e) => setEditingCity({...editingCity, travel_time_minutes: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Orario Arrivo</label>
                      <input
                        type="time"
                        value={editingCity.default_arrival_time || "10:00"}
                        onChange={(e) => setEditingCity({...editingCity, default_arrival_time: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Indirizzo</label>
                      <input
                        type="text"
                        value={editingCity.address}
                        onChange={(e) => setEditingCity({...editingCity, address: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setEditingCity(null)}
                      className="px-3 py-1 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm"
                    >
                      Annulla
                    </button>
                    <button
                      onClick={() => handleUpdateCity(location.city_name)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Salva
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800 text-sm sm:text-base">{location.city_name}</h3>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs sm:text-sm text-slate-600">
                      <span>🚗 {location.distance_km} km</span>
                      <span>⏱️ {location.travel_time_minutes} min</span>
                      <span>🕐 Arrivo: {location.default_arrival_time || "10:00"}</span>
                      {location.address && <span className="hidden sm:inline">📍 {location.address}</span>}
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => setEditingCity(location)}
                      data-testid={`edit-city-${location.city_name}`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Modifica"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteCity(location.city_name)}
                      data-testid={`delete-city-${location.city_name}`}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Elimina"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Work Info */}
      <div className="bg-slate-50 rounded-xl p-4 sm:p-6">
        <h3 className="font-semibold text-slate-700 mb-3 text-sm sm:text-base">ℹ️ Informazioni Lavoro</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-600">
          <div>
            <p className="font-medium text-slate-700 mb-2">Orario:</p>
            <ul className="space-y-1">
              <li>• Ore lavoro: 8 ore effettive</li>
              <li>• Pausa pranzo: 1 ora</li>
              <li>• Presenza totale: 9 ore</li>
              <li>• Tolleranza extra: {tolerance || 15} min (modificabile)</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-slate-700 mb-2">Viaggio:</p>
            <ul className="space-y-1">
              <li>• Primi 30 min andata: non pagati</li>
              <li>• Primi 30 min ritorno: non pagati</li>
              <li>• Tempo oltre 30 min: lavorativo</li>
              <li>• Traffico ritorno: tempo personale</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;