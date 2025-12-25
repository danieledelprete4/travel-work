import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useUser } from "./UserContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function UserProfile() {
  const { currentUser, logout } = useUser();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwords, setPasswords] = useState({
    old_password: "",
    new_password: "",
    confirm_password: ""
  });
  const [loading, setLoading] = useState(false);

  const getRoleLabel = (role) => {
    if (role === "super_admin") return "Super Amministratore";
    if (role === "hr") return "Risorse Umane";
    return "Support Sales";
  };

  const getRoleIcon = (role) => {
    if (role === "super_admin") return "🔐";
    if (role === "hr") return "👔";
    return "📊";
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwords.new_password !== passwords.confirm_password) {
      toast.error("Le password non coincidono");
      return;
    }

    if (passwords.new_password.length < 6) {
      toast.error("La password deve essere di almeno 6 caratteri");
      return;
    }

    setLoading(true);
    
    try {
      await axios.post(`${API}/auth/change-password`, {
        old_password: passwords.old_password,
        new_password: passwords.new_password
      });
      
      toast.success("Password aggiornata con successo!");
      setShowChangePassword(false);
      setPasswords({ old_password: "", new_password: "", confirm_password: "" });
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(error.response?.data?.detail || "Errore nell'aggiornamento password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-4xl">
              {getRoleIcon(currentUser?.role)}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{currentUser?.name || currentUser?.username}</h2>
              <p className="text-blue-100">{getRoleLabel(currentUser?.role)}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Email */}
          <div className="flex items-center justify-between py-3 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <div>
                <p className="text-sm text-slate-500">Email</p>
                <p className="font-medium text-slate-800">{currentUser?.email || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Username (solo per super admin) */}
          {currentUser?.username && (
            <div className="flex items-center justify-between py-3 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div>
                  <p className="text-sm text-slate-500">Username</p>
                  <p className="font-medium text-slate-800">{currentUser.username}</p>
                </div>
              </div>
            </div>
          )}

          {/* Role */}
          <div className="flex items-center justify-between py-3 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <div>
                <p className="text-sm text-slate-500">Mansione</p>
                <p className="font-medium text-slate-800">{getRoleLabel(currentUser?.role)}</p>
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <div>
                <p className="text-sm text-slate-500">Password</p>
                <p className="font-medium text-slate-800">••••••••</p>
              </div>
            </div>
            <button
              onClick={() => setShowChangePassword(true)}
              data-testid="change-password-btn"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Cambia Password
            </button>
          </div>

          {/* Registered Date */}
          {currentUser?.created_at && (
            <div className="pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500">
                Registrato il: {new Date(currentUser.created_at).toLocaleDateString('it-IT', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">Cambia Password</h3>
              <button
                onClick={() => {
                  setShowChangePassword(false);
                  setPasswords({ old_password: "", new_password: "", confirm_password: "" });
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Password Attuale
                </label>
                <input
                  type="password"
                  value={passwords.old_password}
                  onChange={(e) => setPasswords({...passwords, old_password: e.target.value})}
                  required
                  data-testid="old-password-input"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nuova Password
                </label>
                <input
                  type="password"
                  value={passwords.new_password}
                  onChange={(e) => setPasswords({...passwords, new_password: e.target.value})}
                  required
                  data-testid="new-password-input"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Conferma Nuova Password
                </label>
                <input
                  type="password"
                  value={passwords.confirm_password}
                  onChange={(e) => setPasswords({...passwords, confirm_password: e.target.value})}
                  required
                  data-testid="confirm-password-input"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              {passwords.new_password && passwords.confirm_password && passwords.new_password !== passwords.confirm_password && (
                <p className="text-sm text-red-600">Le password non coincidono</p>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswords({ old_password: "", new_password: "", confirm_password: "" });
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={loading || passwords.new_password !== passwords.confirm_password}
                  data-testid="submit-change-password"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Aggiornamento..." : "Aggiorna Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProfile;
