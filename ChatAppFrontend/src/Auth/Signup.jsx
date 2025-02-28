import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


function Signup() {
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch("https://chatapp-backend-46f1.onrender.com/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (response.ok) navigate("/login");
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-black">
      <h1 className="text-3xl flex items-center font-bold font-serif mb-16 text-white">Welcome To Convo <img src="./chat.jpg" className="w-12 h-12"/></h1>
      <form onSubmit={handleSubmit} className="bg-black p-6 rounded-4xl shadow-sm shadow-white w-96">
        <h2 className="text-2xl font-sans mb-4 text-white">Sign Up</h2>
        <input type="text" name="username" placeholder="Username" onChange={handleChange} className="w-full p-3 mb-4 border text-white rounded-3xl" required />
        <input type="email" name="email" placeholder="Email" onChange={handleChange} className="w-full p-3 mb-4 border text-white rounded-3xl" required />
        <input type="password" name="password" placeholder="Password" onChange={handleChange} className="w-full p-3 mb-3 border text-white rounded-3xl" required />
        <button type="submit" className="w-full bg-blue-500 text-white p-3 rounded-2xl cursor-pointer">Sign Up</button>
        <p className="text-sm mt-2 text-white">Already have an account ? <span className="text-blue-500 cursor-pointer" onClick={() => navigate("/login")}>Log in</span></p>
      </form>
    </div>
  );
}

function Login() {
  const { setUser } = useAuth();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch("http://localhost:8000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(formData),
    });
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      navigate("/");
    } else {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-black">
      <h1 className="text-3xl font-bold font-serif mb-16 text-white flex items-center">Welcome To Convo <img src="./chat.jpg" className="h-12 w-12"/></h1>
      <form onSubmit={handleSubmit} className="bg-black p-6 rounded-4xl shadow-sm shadow-white w-96">
        <h2 className="text-2xl font-sans mb-4">Log In</h2>
        <input type="email" name="email" placeholder="Email" onChange={handleChange} className="w-full p-3 mb-3 border rounded-2xl text-white" required />
        <input type="password" name="password" placeholder="Password" onChange={handleChange} className="w-full p-3 mb-3 border rounded-2xl text-white" required />
        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded-2xl cursor-pointer">Log In</button>
         <p className="text-sm mt-2 text-white">Don't Have Account ? <span className="text-blue-500 cursor-pointer" onClick={() => navigate("/signup")}>Signup</span></p>
      </form>
    </div>
  );
}

export { Signup, Login };
