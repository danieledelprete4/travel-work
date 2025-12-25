import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useUser } from "./UserContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function SuperAdminPanel() {
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showGoogleSettings, setShowGoogleSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useUser();

  // Create user form
  const [newUser, setNewUser] = useState({
    email: "",
    name: "",
    password: "amma1234",
    role: "user"
  });

  // Google settings
  const [googleSettings, setGoogleSettings] = useState({
    google_oauth_client_id: "",
    google_oauth_client_secret: "",
    google_maps_api_key: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, settingsRes] = await Promise.all([
        axios.get(`${API}/users`),
        axios.get(`${API}/settings`)
      ]);
      
      setUsers(usersRes.data);
      setSettings(settingsRes.data);
      
      // Load Google settings
      setGoogleSettings({
        google_oauth_client_id: settingsRes.data.google_oauth_client_id || "",
        google_oauth_client_secret: settingsRes.data.google_oauth_client_secret || "",
        google_maps_api_key: settingsRes.data.google_maps_api_key || ""
      });
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Errore nel caricamento dati");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post(`${API}/users`, newUser);
      toast.success("Utente creato con successo!");
      setShowCreateUser(false);
      setNewUser({ email: "", name: "", password: "amma1234", role: "user" });
      loadData();
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error(error.response?.data?.detail || "Errore nella creazione utente");
    }
  };

  const handleBlockUser = async (userId, blocked) => {
    try {
      await axios.put(`${API}/users/${userId}/block?blocked=${blocked}`);
      toast.success(blocked ? "Utente bloccato" : "Utente sbloccato");
      loadData();
    } catch (error) {
      console.error("Error blocking user:", error);
      toast.error("Errore nell'operazione");
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Sei sicuro di voler eliminare l'utente ${userName}? Tutte le sue giornate verranno eliminate.`)) {
      return;
    }

    try {
      await axios.delete(`${API}/users/${userId}`);
      toast.success("Utente eliminato");
      loadData();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Errore nell'eliminazione");
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await axios.put(`${API}/users/${userId}/role?role=${newRole}`);
      toast.success("Ruolo aggiornato");
      loadData();
    } catch (error) {
      console.error("Error changing role:", error);
      toast.error("Errore nell'aggiornamento ruolo");
    }
  };

  const handleSaveGoogleSettings = async (e) => {
    e.preventDefault();
    
    try {
      const updatedSettings = {
        ...settings,
        ...googleSettings
      };
      
      await axios.put(`${API}/settings`, updatedSettings);
      toast.success("Impostazioni Google salvate con successo!");
      setShowGoogleSettings(false);
      loadData();
    } catch (error) {
      console.error("Error saving Google settings:", error);
      toast.error("Errore nel salvataggio impostazioni");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">🔐 Pannello Super Amministratore</h2>
            <p className="text-red-100">Gestione completa del sistema</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-red-100">Benvenuto</p>
            <p className="text-lg font-semibold">{currentUser?.username || currentUser?.name}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setShowCreateUser(true)}
          data-testid="create-user-btn"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Crea Nuovo Utente</span>
        </button>

        <button
          onClick={() => setShowGoogleSettings(true)}
          data-testid="google-settings-btn"
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Impostazioni Google</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Utenti Registrati ({users.length})</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Ruolo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Stato</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-slate-900">{user.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-600">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => handleChangeRole(user.id, e.target.value)}
                      className="px-3 py-1 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      data-testid={`role-select-${user.id}`}
                    >
                      <option value="user">Support Sales</option>
                      <option value="hr">HR</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.blocked ? (
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        🚫 Bloccato
                      </span>
                    ) : (
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        ✅ Attivo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => handleBlockUser(user.id, !user.blocked)}
                      className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                        user.blocked
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                      }`}
                      data-testid={`block-btn-${user.id}`}
                    >
                      {user.blocked ? "Sblocca" : "Blocca"}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id, user.name)}
                      className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium transition-colors"
                      data-testid={`delete-btn-${user.id}`}
                    >
                      Elimina
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">Crea Nuovo Utente</h3>
              <button
                onClick={() => setShowCreateUser(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  required
                  data-testid="new-user-email"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="utente@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nome Completo</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  required
                  data-testid="new-user-name"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Mario Rossi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Password Iniziale</label>
                <input
                  type="text"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  required
                  data-testid="new-user-password"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="amma1234"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Ruolo</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  data-testid="new-user-role"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="user">Support Sales</option>
                  <option value="hr">HR (Solo Visualizzazione)</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateUser(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  data-testid="submit-create-user"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Crea Utente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Settings Modal */}
      {showGoogleSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">Impostazioni Google</h3>
              <button
                onClick={() => setShowGoogleSettings(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Instructions */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">📘 Come ottenere le credenziali:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                <li>Vai su <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
                <li>Crea un nuovo progetto o seleziona uno esistente</li>
                <li><strong>Google OAuth:</strong> Vai su "API e servizi" > "Credenziali" > "Crea credenziali" > "ID client OAuth 2.0"</li>
                <li><strong>Google Maps:</strong> Vai su "API e servizi" > "Libreria" > Abilita "Maps JavaScript API" > "Credenziali"</li>
              </ol>
            </div>

            <form onSubmit={handleSaveGoogleSettings} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Google OAuth Client ID
                </label>
                <input
                  type="text"
                  value={googleSettings.google_oauth_client_id}
                  onChange={(e) => setGoogleSettings({...googleSettings, google_oauth_client_id: e.target.value})}
                  data-testid="google-oauth-client-id"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="123456789-abc.apps.googleusercontent.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Google OAuth Client Secret
                </label>
                <input
                  type="text"
                  value={googleSettings.google_oauth_client_secret}
                  onChange={(e) => setGoogleSettings({...googleSettings, google_oauth_client_secret: e.target.value})}
                  data-testid="google-oauth-client-secret"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="GOCSPX-..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Google Maps API Key
                </label>
                <input
                  type="text"
                  value={googleSettings.google_maps_api_key}
                  onChange={(e) => setGoogleSettings({...googleSettings, google_maps_api_key: e.target.value})}
                  data-testid="google-maps-api-key"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="AIzaSy..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowGoogleSettings(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  data-testid="submit-google-settings"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Salva Impostazioni
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SuperAdminPanel;
