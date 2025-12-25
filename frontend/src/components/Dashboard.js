import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Dashboard({ month, year, onMonthChange }) {
  const [stats, setStats] = useState(null);
  const [workDays, setWorkDays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [month, year]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load monthly stats
      const statsRes = await axios.get(`${API}/stats/monthly`, {
        params: { month: month.toString(), year: year.toString() }
      });
      setStats(statsRes.data);

      // Load workdays for details
      const workdaysRes = await axios.get(`${API}/workdays`, {
        params: { month: month.toString(), year: year.toString() }
      });
      setWorkDays(workdaysRes.data.filter(wd => wd.city)); // Only work days
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Errore nel caricamento dei dati");
    } finally {
      setLoading(false);
    }
  };

  const monthNames = [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-lg text-slate-600">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => onMonthChange("prev")}
            data-testid="dashboard-prev-month"
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h2 className="text-2xl font-bold text-slate-800">
            Dashboard - {monthNames[month - 1]} {year}
          </h2>
          
          <button
            onClick={() => onMonthChange("next")}
            data-testid="dashboard-next-month"
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total KM */}
        <div className="stat-card bg-white rounded-xl shadow-lg p-4 sm:p-6" data-testid="stat-total-km">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium text-slate-600">KM Totali</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-1 sm:mt-2">{stats?.total_km || 0}</p>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-1">km percorsi</p>
            </div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* KM Allowance */}
        <div className="stat-card bg-white rounded-xl shadow-lg p-4 sm:p-6" data-testid="stat-km-allowance">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium text-slate-600">Rimborso Usura KM</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1 sm:mt-2">€ {stats?.km_allowance || 0}</p>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-1">forfettario mensile</p>
            </div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Time at Store */}
        <div className="stat-card bg-white rounded-xl shadow-lg p-4 sm:p-6" data-testid="stat-time-store">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium text-slate-600">Tempo in VIS</p>
              <p className="text-2xl sm:text-3xl font-bold text-purple-600 mt-1 sm:mt-2">
                {Math.floor((stats?.total_time_at_store_minutes || 0) / 60)}h {(stats?.total_time_at_store_minutes || 0) % 60}m
              </p>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-1">tempo totale negozio</p>
            </div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        {/* Travel Time */}
        <div className="stat-card bg-white rounded-xl shadow-lg p-4 sm:p-6" data-testid="stat-travel-time">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium text-slate-600">Tempo in Auto</p>
              <p className="text-2xl sm:text-3xl font-bold text-orange-600 mt-1 sm:mt-2">
                {Math.floor((stats?.total_travel_time_minutes || 0) / 60)}h {(stats?.total_travel_time_minutes || 0) % 60}m
              </p>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-1">senza traffico</p>
            </div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-4 sm:p-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm sm:text-base font-semibold text-slate-800 mb-2">💡 Confronto Tempi</h3>
            <div className="space-y-1 text-xs sm:text-sm text-slate-700">
              <p>• <strong>Tempo in VIS:</strong> Include presenza in negozio con pausa (teorico)</p>
              <p>• <strong>Tempo in auto:</strong> Calcolato senza traffico (per confronto con timbrature)</p>
              <p>• <strong>Usa le timbrature reali</strong> per confrontare con i tempi teorici</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4 sm:p-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm sm:text-base font-semibold text-slate-800 mb-2">💰 Rimborsi e Coperture</h3>
            <div className="space-y-1 text-xs sm:text-sm text-slate-700">
              <p>• <strong>Usura macchina:</strong> €{stats?.km_allowance || 0}/mese (rimborso forfettario)</p>
              <p>• <strong>Benzina e Pedaggio:</strong> Coperti da azienda tramite Telepass aziendale</p>
              <p>• <strong>Telepass:</strong> Nessun costo a tuo carico</p>
            </div>
          </div>
        </div>
      </div>

      {/* Work Days Summary */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-800">Riepilogo Giornate</h3>
          <div className="text-sm text-slate-600">
            <span className="font-semibold">{stats?.work_days || 0}</span> giorni lavorativi
          </div>
        </div>

        {workDays.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            Nessuna giornata lavorativa registrata
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Data</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Città</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Partenza</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Arrivo</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Uscita</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Rientro</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">KM</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Costo</th>
                </tr>
              </thead>
              <tbody>
                {workDays.map((wd) => (
                  <tr key={wd.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-sm text-slate-700">{wd.date}</td>
                    <td className="py-3 px-4 text-sm font-medium text-slate-800">{wd.city}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{wd.departure_from_home}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{wd.arrival_at_store}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{wd.exit_from_store}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{wd.return_home}</td>
                    <td className="py-3 px-4 text-sm text-slate-700 text-right">{wd.total_km} km</td>
                    <td className="py-3 px-4 text-sm text-slate-700 text-right font-medium">€ {wd.fuel_cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* City Breakdown */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-4">Destinazioni</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(
            workDays.reduce((acc, wd) => {
              if (!acc[wd.city]) {
                acc[wd.city] = { count: 0, km: 0, cost: 0 };
              }
              acc[wd.city].count++;
              acc[wd.city].km += wd.total_km;
              acc[wd.city].cost += wd.fuel_cost;
              return acc;
            }, {})
          ).map(([city, data]) => (
            <div key={city} className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg p-4 border border-slate-200">
              <h4 className="font-semibold text-slate-800 mb-2">{city}</h4>
              <div className="space-y-1 text-sm text-slate-600">
                <div>📅 {data.count} visite</div>
                <div>🚗 {Math.round(data.km)} km</div>
                <div>💰 € {data.cost.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;