import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from './lib/axios';
import './App.css';

// ============ LOGIN COMPONENT ============
function Login() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/auth/login', { username, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      if (response.data.user.role === 'super_admin' || response.data.user.role === 'admin' || response.data.user.role === 'hr') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Errore durante il login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-3xl p-8 w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-black rounded-3xl mx-auto mb-6 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h1 className="text-4xl font-semibold text-black tracking-tight">Work Travel</h1>
          <p className="text-gray-500 mt-2 text-sm font-light">Gestione viaggi e ore lavoro</p>
        </div>

        <div className="flex gap-3 mb-8">
          <button
            onClick={() => setIsAdmin(false)}
            className={`flex-1 py-2.5 px-4 rounded-full font-medium transition text-sm ${
              !isAdmin ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Utente
          </button>
          <button
            onClick={() => setIsAdmin(true)}
            className={`flex-1 py-2.5 px-4 rounded-full font-medium transition text-sm ${
              isAdmin ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
              {isAdmin ? 'Username Admin' : 'Email'}
            </label>
            <input
              type="text"
              placeholder={isAdmin ? 'adminamma' : 'tuo@email.com'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-sm"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-2xl text-sm font-light">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg font-medium text-white transition ${
              isAdmin ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Accesso...' : 'Accedi'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>🔒 Sistema di autenticazione sicuro con JWT.</p>
          <p className="mt-1">Gli account vengono creati dal Super Amministratore.</p>
        </div>

        <p className="mt-4 text-center text-xs text-gray-500">
          Non hai un account? Contatta l'amministratore.
        </p>
      </div>
    </div>
  );
}

// ============ ADMIN DASHBOARD ============
function AdminDashboard() {
  const [tab, setTab] = useState('admin');
  const [users, setUsers] = useState([]);
  const [cities, setCities] = useState([]);
  const [roles, setRoles] = useState([]);
  const [profile, setProfile] = useState(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateCity, setShowCreateCity] = useState(false);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', name: '', role: 'user', password: 'amma1234' });
  const [newCity, setNewCity] = useState({ name: '', travel_minutes: 0 });
  const [newRole, setNewRole] = useState({ name: '', permissions: [] });
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    try {
      if (tab === 'admin') {
        const [usersRes, citiesRes, rolesRes] = await Promise.all([
          axios.get('/users'),
          axios.get('/cities'),
          axios.get('/roles')
        ]);
        setUsers(usersRes.data);
        setCities(citiesRes.data);
        setRoles(rolesRes.data);
      } else if (tab === 'profile') {
        const profileRes = await axios.get('/profile');
        setProfile(profileRes.data);
        setNewEmail(profileRes.data.email || '');
      }
    } catch (error) {
      console.error('Errore caricamento dati:', error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const createUser = async () => {
    try {
      await axios.post('/users', newUser);
      setShowCreateUser(false);
      setNewUser({ email: '', name: '', role: 'user', password: 'amma1234' });
      loadData();
    } catch (error) {
      alert(error.response?.data?.detail || 'Errore creazione utente');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo utente?')) return;
    try {
      await axios.delete(`/users/${userId}`);
      loadData();
    } catch (error) {
      alert('Errore eliminazione utente');
    }
  };

  const toggleBlockUser = async (userId, blocked) => {
    try {
      await axios.patch(`/users/${userId}`, { blocked: !blocked });
      loadData();
    } catch (error) {
      alert('Errore modifica stato utente');
    }
  };

  const createCity = async () => {
    try {
      await axios.post('/cities', newCity);
      setShowCreateCity(false);
      setNewCity({ name: '', travel_minutes: 0 });
      loadData();
    } catch (error) {
      alert(error.response?.data?.detail || 'Errore creazione città');
    }
  };

  const deleteCity = async (cityId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa città?')) return;
    try {
      await axios.delete(`/cities/${cityId}`);
      loadData();
    } catch (error) {
      alert('Errore eliminazione città');
    }
  };

  const createRole = async () => {
    try {
      await axios.post('/roles', newRole);
      setShowCreateRole(false);
      setNewRole({ name: '', permissions: [] });
      loadData();
    } catch (error) {
      alert(error.response?.data?.detail || 'Errore creazione ruolo');
    }
  };

  const updateEmail = async () => {
    try {
      await axios.patch('/profile', { email: newEmail });
      setEditingEmail(false);
      loadData();
      alert('Email aggiornata con successo!');
    } catch (error) {
      alert(error.response?.data?.detail || 'Errore aggiornamento email');
    }
  };

  const handleCsvImport = async () => {
    if (!csvFile) {
      alert('Seleziona un file CSV');
      return;
    }

    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      const response = await axios.post('/workdays/import-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImportResult(response.data);
      setCsvFile(null);
    } catch (error) {
      alert(error.response?.data?.detail || 'Errore import CSV');
    }
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-red-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold">Work Travel Manager</h1>
                <p className="text-sm text-red-100">Gestione completa del sistema</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm">Benvenuto</p>
              <p className="font-bold">{user.username || user.name}</p>
            </div>
            <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold">
              👑 {user.role === 'super_admin' ? 'Super Amministratore' : user.role === 'hr' ? 'HR' : 'Admin'}
            </div>
            <button
              onClick={handleLogout}
              className="bg-white text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition font-medium"
            >
              Esci
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            <button
              onClick={() => setTab('admin')}
              className={`px-6 py-3 font-medium transition ${
                tab === 'admin'
                  ? 'border-b-2 border-red-600 text-red-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              👑 Pannello Admin
            </button>
            <button
              onClick={() => setTab('profile')}
              className={`px-6 py-3 font-medium transition ${
                tab === 'profile'
                  ? 'border-b-2 border-red-600 text-red-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              👤 Profilo
            </button>
            <button
              onClick={() => setTab('csv')}
              className={`px-6 py-3 font-medium transition ${
                tab === 'csv'
                  ? 'border-b-2 border-red-600 text-red-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📊 Import CSV
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {tab === 'admin' && (
          <div className="space-y-8">
            {/* Panel Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-2">👑 Pannello Super Amministratore</h2>
              <p className="text-red-100">Gestione completa del sistema</p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setShowCreateUser(true)}
                className="bg-blue-600 text-white p-4 rounded-xl hover:bg-blue-700 transition shadow-lg font-medium flex items-center justify-center gap-2"
              >
                <span className="text-2xl">+</span> Crea Nuovo Utente
              </button>
              <button
                onClick={() => setShowCreateCity(true)}
                className="bg-green-600 text-white p-4 rounded-xl hover:bg-green-700 transition shadow-lg font-medium flex items-center justify-center gap-2"
              >
                <span className="text-2xl">+</span> Aggiungi Città
              </button>
              {user.role === 'super_admin' && (
                <button
                  onClick={() => setShowCreateRole(true)}
                  className="bg-purple-600 text-white p-4 rounded-xl hover:bg-purple-700 transition shadow-lg font-medium flex items-center justify-center gap-2"
                >
                  <span className="text-2xl">+</span> Crea Ruolo Personalizzato
                </button>
              )}
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b bg-gray-50">
                <h3 className="text-xl font-bold">Utenti Registrati ({users.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">NOME</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">EMAIL</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">RUOLO</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">STATO</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">AZIONI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">{u.name}</td>
                        <td className="px-6 py-4 text-gray-600">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            u.blocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {u.blocked ? '❌ Bloccato' : '✅ Attivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleBlockUser(u.id, u.blocked)}
                              className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 text-sm"
                            >
                              {u.blocked ? 'Sblocca' : 'Blocca'}
                            </button>
                            <button
                              onClick={() => deleteUser(u.id)}
                              className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 text-sm"
                            >
                              Elimina
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cities Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b bg-gray-50">
                <h3 className="text-xl font-bold">Città ({cities.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">NOME CITTÀ</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">MINUTI VIAGGIO</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">AZIONI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {cities.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">{c.name}</td>
                        <td className="px-6 py-4 text-gray-600">{c.travel_minutes} min</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => deleteCity(c.id)}
                            className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 text-sm"
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

            {/* Roles Table */}
            {user.role === 'super_admin' && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b bg-gray-50">
                  <h3 className="text-xl font-bold">Ruoli ({roles.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">NOME RUOLO</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">PERMESSI</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">TIPO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {roles.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium">{r.name}</td>
                          <td className="px-6 py-4 text-gray-600">{r.permissions.join(', ')}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              r.custom ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {r.custom ? 'Personalizzato' : 'Sistema'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'profile' && profile && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-6">Il Mio Profilo</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                  <input
                    type="text"
                    value={profile.name}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  {editingEmail ? (
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={updateEmail}
                        className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Salva
                      </button>
                      <button
                        onClick={() => {
                          setEditingEmail(false);
                          setNewEmail(profile.email);
                        }}
                        className="px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                      >
                        Annulla
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={profile.email}
                        disabled
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                      />
                      <button
                        onClick={() => setEditingEmail(true)}
                        className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Modifica
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ruolo</label>
                  <input
                    type="text"
                    value={profile.role}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Registrato il</label>
                  <input
                    type="text"
                    value={new Date(profile.created_at).toLocaleDateString('it-IT')}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'csv' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-6">Import CSV Giornate Lavorative</h2>
              
              <div className="space-y-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files[0])}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label htmlFor="csv-upload" className="cursor-pointer">
                    <div className="text-6xl mb-4">📁</div>
                    <p className="text-lg font-medium text-gray-700">
                      {csvFile ? csvFile.name : 'Seleziona file CSV'}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Click per selezionare un file CSV
                    </p>
                  </label>
                </div>

                <button
                  onClick={handleCsvImport}
                  disabled={!csvFile}
                  className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                >
                  Importa CSV
                </button>

                {importResult && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="font-bold text-lg mb-3">Risultato Import</h3>
                    <div className="space-y-2 text-sm">
                      <p>✅ Righe lette: <strong>{importResult.rows_read}</strong></p>
                      <p>💾 Righe salvate: <strong>{importResult.rows_saved}</strong></p>
                      {importResult.errors.length > 0 && (
                        <div className="mt-4">
                          <p className="font-bold text-red-700">⚠️ Errori:</p>
                          <ul className="list-disc list-inside text-red-600 mt-2">
                            {importResult.errors.map((err, i) => (
                              <li key={i}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-bold mb-3">Formato CSV richiesto:</h3>
                  <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                    <li>Separatore: <code>,</code> o <code>;</code></li>
                    <li>Colonne richieste: Giorno, Città, Minuti andata, Minuti ritorno, ecc.</li>
                    <li>Date formato: DD/MM/YYYY</li>
                    <li>Orari formato: HH:MM:SS</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-6">Crea Nuovo Utente</h3>
            <div className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Nome completo"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg"
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg"
              >
                <option value="user">User (Support Sales)</option>
                <option value="hr">HR</option>
                <option value="admin">Admin</option>
                {user.role === 'super_admin' && <option value="super_admin">Super Admin</option>}
              </select>
              <input
                type="text"
                placeholder="Password (default: amma1234)"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={createUser}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
              >
                Crea
              </button>
              <button
                onClick={() => setShowCreateUser(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateCity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-6">Aggiungi Città</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nome città"
                value={newCity.name}
                onChange={(e) => setNewCity({ ...newCity, name: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg"
              />
              <input
                type="number"
                placeholder="Minuti viaggio"
                value={newCity.travel_minutes}
                onChange={(e) => setNewCity({ ...newCity, travel_minutes: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border rounded-lg"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={createCity}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700"
              >
                Aggiungi
              </button>
              <button
                onClick={() => setShowCreateCity(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-6">Crea Ruolo Personalizzato</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nome ruolo (es: project_manager)"
                value={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Permessi (separati da virgola)"
                value={newRole.permissions.join(', ')}
                onChange={(e) => setNewRole({ ...newRole, permissions: e.target.value.split(',').map(p => p.trim()) })}
                className="w-full px-4 py-3 border rounded-lg"
              />
              <p className="text-sm text-gray-600">
                Esempio permessi: manage_users, view_reports, edit_cities
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={createRole}
                className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700"
              >
                Crea
              </button>
              <button
                onClick={() => setShowCreateRole(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ USER DASHBOARD ============
function UserDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Dashboard Utente</h1>
          <button
            onClick={handleLogout}
            className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50"
          >
            Esci
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Benvenuto, {user.name}!</h2>
          <p className="text-gray-600">Questa è la tua dashboard personale.</p>
        </div>
      </main>
    </div>
  );
}

// ============ MAIN APP ============
function App() {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={!isAuthenticated ? <Login /> : <Navigate to="/admin" />} />
        <Route
          path="/admin"
          element={isAuthenticated ? <AdminDashboard /> : <Navigate to="/" />}
        />
        <Route
          path="/dashboard"
          element={isAuthenticated ? <UserDashboard /> : <Navigate to="/" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
