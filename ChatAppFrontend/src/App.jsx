import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./Components/Home";
import { ChatList } from "./Components/ChatList";
import { ChatPage } from "./Components/ChatList";
import { AuthProvider } from "./context/AuthContext";
import RequireAuth from "./context/RequireAuth";
import { Login, Signup } from "./Auth/Signup";
import ProfilePage from "./pages/ProfilePage";
import Reels from "./pages/Reels";
import Posts from "./pages/Post";


function App() {
  return (
    <AuthProvider>
    <Router>
      <Routes>
        <Route path="/" element={<RequireAuth><Home/></RequireAuth>} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup/>}/>
        <Route path="/messages" element={<ChatList />} />
        <Route path="/chat/:id" element={<ChatPage/>}/>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/reels" element={<Reels />} />
        <Route path="/post" element={<Posts/>}/>
      </Routes>
      </Router>
      </AuthProvider>
  );
}

export default App;
