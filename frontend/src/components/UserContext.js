import { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const UserContext = createContext();

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser deve essere usato dentro UserProvider");
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null); // Per HR e Super Admin
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user from token
    const token = localStorage.getItem("auth_token");
    if (token) {
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Fetch current user
      axios.get(`${API}/auth/me`)
        .then(response => {
          setCurrentUser(response.data);
        })
        .catch(error => {
          console.error("Token validation failed:", error);
          localStorage.removeItem("auth_token");
          delete axios.defaults.headers.common['Authorization'];
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = (user) => {
    setCurrentUser(user);
  };

  const logout = () => {
    setCurrentUser(null);
    setSelectedUserId(null);
    localStorage.removeItem("auth_token");
    delete axios.defaults.headers.common['Authorization'];
  };

  const isSuperAdmin = () => {
    return currentUser?.role === "super_admin";
  };

  const isHR = () => {
    return currentUser?.role === "hr";
  };

  const isUser = () => {
    return currentUser?.role === "user";
  };

  const getEffectiveUserId = () => {
    if ((isHR() || isSuperAdmin()) && selectedUserId) {
      return selectedUserId;
    }
    return currentUser?.id;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <UserContext.Provider
      value={{
        currentUser,
        selectedUserId,
        setSelectedUserId,
        login,
        logout,
        isSuperAdmin,
        isHR,
        isUser,
        getEffectiveUserId
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
