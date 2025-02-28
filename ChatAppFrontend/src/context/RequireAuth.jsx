import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

export default function RequireAuth({ children }) {
	const { user } = useAuth();
	return user ? children : <Navigate to="/login" />;
}
