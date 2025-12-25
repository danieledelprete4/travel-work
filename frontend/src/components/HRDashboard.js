import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useUser } from "./UserContext";
import Dashboard from "./Dashboard";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function HRDashboard({ month, year, onMonthChange }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { selectedUserId, setSelectedUserId } = useUser();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/users`);
      const salesUsers = response.data.filter(u => u.role === "user");
      setUsers(salesUsers);
      
      // Seleziona automaticamente il primo utente
      if (salesUsers.length > 0 && !selectedUserId) {
        setSelectedUserId(salesUsers[0].id);
      }
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Errore nel caricamento utenti");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-lg text-slate-600">Caricamento...</div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
        <svg className="w-16 h-16 text-yellow-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Nessun Support Sales Trovato</h3>
        <p className="text-slate-600">Non ci sono ancora utenti Support Sales registrati nel sistema.</p>
      </div>
    );
  }

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="space-y-6">
      {/* User Selector */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-1">Visualizzazione HR</h2>
            <p className="text-sm text-slate-600">Seleziona un Support Sales per vedere il suo andamento</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Support Sales
          </label>
          <select
            value={selectedUserId || ""}
            onChange={(e) => setSelectedUserId(e.target.value)}
            data-testid="hr-user-select"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
        </div>

        {selectedUser && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{selectedUser.name}</p>
                  <p className="text-sm text-slate-600">{selectedUser.email}</p>
                </div>
              </div>
              
              {/* Export PDF Button */}
              <button
                onClick={() => {
                  const url = `${API}/export/pdf?month=${month}&year=${year}&user_id=${selectedUserId}`;
                  window.open(url, '_blank');
                  toast.success("Download PDF avviato");
                }}
                data-testid="hr-export-pdf"
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Esporta PDF</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info Alert */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-orange-800 mb-1">Modalità Solo Visualizzazione</h3>
            <p className="text-xs text-orange-700">
              Come account HR, puoi solo visualizzare i dati. Non è possibile modificare giornate, impostazioni o città.
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard Component */}
      {selectedUserId && (
        <Dashboard
          month={month}
          year={year}
          onMonthChange={onMonthChange}
          readOnly={true}
        />
      )}
    </div>
  );
}

export default HRDashboard;
