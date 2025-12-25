import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useUser } from "./UserContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Login() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useUser();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const loginData = {
        password: password
      };

      if (isSuperAdmin) {
        loginData.username = username;
      } else {
        loginData.email = email;
      }

      const response = await axios.post(`${API}/auth/login`, loginData);
      const { token, user, role: userRole } = response.data;

      // Save token
      localStorage.setItem("auth_token", token);
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      login(user);
      toast.success(`Benvenuto ${user.name || user.username}!`);
    } catch (error) {
      console.error("Error during login:", error);
      const errorMsg = error.response?.data?.detail || "Errore durante il login";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    toast.error("La registrazione è riservata al Super Amministratore. Contatta l'admin per creare un account.");
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Header - Apple Style */}
        <div className="text-center mb-12">
          <div className="inline-block p-4 bg-black rounded-3xl mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h1 className="text-4xl font-semibold text-black mb-2 tracking-tight">Work Travel</h1>
          <p className="text-gray-500 text-sm font-light">Gestione viaggi e ore lavoro</p>
        </div>

        {/* Login Card - Apple Style */}
        <div className="bg-white border border-gray-200 rounded-3xl p-8">
          <div className="mb-8 flex items-center justify-center space-x-3">
            <button
              onClick={() => {
                setIsSuperAdmin(false);
                setIsRegistering(false);
              }}
              data-testid="tab-user-login"
              className={`px-6 py-2.5 rounded-full font-medium transition-all text-sm ${
                !isSuperAdmin
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Utente
            </button>
            <button
              onClick={() => {
                setIsSuperAdmin(true);
                setIsRegistering(false);
              }}
              data-testid="tab-admin-login"
              className={`px-6 py-2.5 rounded-full font-medium transition-all text-sm ${
                isSuperAdmin
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Admin
            </button>
          </div>

          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-5">
            {isSuperAdmin ? (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                  Username Admin
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  data-testid="admin-username-input"
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-sm"
                  placeholder="adminamma"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="user-email-input"
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-sm"
                  placeholder="tuo@email.com"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="password-input"
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              data-testid="login-submit-btn"
              className="w-full py-3.5 rounded-full bg-black text-white font-medium hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6 text-sm"
            >
              {loading ? "Caricamento..." : "Accedi"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center font-light">
              Sistema di autenticazione sicuro<br />
              {isSuperAdmin 
                ? "Accesso riservato al Super Amministratore"
                : "Gli account vengono creati dal Super Amministratore"}
            </p>
          </div>
        </div>

        {/* Info */}
        {!isSuperAdmin && (
          <div className="mt-6 text-center text-sm text-gray-400">
            <p className="font-light">Non hai un account? Contatta l'amministratore</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
