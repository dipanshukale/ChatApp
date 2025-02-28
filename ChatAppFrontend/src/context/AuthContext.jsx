import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser && storedUser !== "undefined" ? JSON.parse(storedUser) : null; // ✅ Fix applied
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
      return null;
    }
  });

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return setUser(null);

      try {
        const response = await fetch("http://localhost:8000/profile", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user)); // ✅ Ensure valid JSON storage
        } else {
          logout();
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        logout();
      }
    };

    if (!user) {
      fetchUser();
    }
  }, []);

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
