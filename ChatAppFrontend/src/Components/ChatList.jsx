import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import { FiArrowLeft, FiPlus, FiX } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

const socket = io("http://localhost:8000", {
  transports: ["websocket", "polling"],
  withCredentials: true,
});

export const ChatList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chatUsers, setChatUsers] = useState([]);

  useEffect(() => {
  if (!user) return;

  const fetchChatUsers = async () => {
    try {
      const response = await fetch("http://localhost:8000/following-list", {
        method: "GET",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!response.ok) throw new Error("Failed to fetch following list");
      const data = await response.json();

      // Fetch unread messages count
      const unreadResponse = await fetch("http://localhost:8000/messages/unread", {
        method: "GET",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const unreadData = await unreadResponse.json();

      const updatedChatUsers = data.following.map((user) => ({
        ...user,
        unreadCount: unreadData[user.id] || 0,
        lastMessage:"",
      }));

      setChatUsers(updatedChatUsers);
    } catch (error) {
      console.error("Error fetching chat users:", error);
    }
  };
  
  fetchChatUsers();
  }, [user]);
  
   useEffect(() => {
    socket.on("newMessage", (newMessage) => {
      if (newMessage.receiver === user.id) {
        setChatUsers((prevUsers) =>
          prevUsers.map((chatUser) =>
            chatUser._id === newMessage.sender
              ? { 
                  ...chatUser, 
                  unreadCount: (chatUser.unreadCount || 0) + 1, 
                  lastMessage: "New Unread Message"
                }
              : chatUser
          )
        );
      }
    });

    return () => socket.off("newMessage");
  }, [user, chatUsers]);

  const openChat = (chatUser) => {
    navigate(`/chat/${chatUser._id}`, { state: chatUser });

    setChatUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === chatUser._id
          ? { ...user, unreadCount: 0, lastMessage: "" }
          : user
      )
    );

    fetch(`http://localhost:8000/messages/mark-as-read/${chatUser._id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
  };


  return (
    <div className="max-w-md mx-auto h-screen bg-black shadow-lg p-6">
      <h2 className="text-white text-lg font-semibold flex items-center gap-6 mt-4 mb-4.5">
        <FiArrowLeft className="text-white text-2xl cursor-pointer" onClick={() => navigate("/")} />
        Messages
      </h2>
      <div className="divide-y divide-gray-200">
        {chatUsers.length > 0 ? (
          chatUsers.map((chatUser) => (
            <div
              key={chatUser._id}
              onClick={() => openChat(chatUser)}
              className="text-white flex items-center gap-3 py-6 cursor-pointer hover:bg-gray-950 px-2 rounded-lg border-white"
            >
              <img src={chatUser.profilePicture || "./profile.jpg"} alt={chatUser.username} className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <h3 className="text-sm font-medium">{chatUser.username}</h3>
                {chatUser.unreadCount > 0 && (
                  <span className=""> {chatUser.unreadCount}</span>
                )}

                {chatUser.lastMessage && (
                  <p className="text-yellow-400 text-xs">{chatUser.lastMessage}</p>
                )}

              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">No following users found.</p>
        )}
      </div>
    </div>
  );
};

export const ChatPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();
  const selectedUser = location.state || {};
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);


  useEffect(() => {
  if (!user || !selectedUser) return;

  const room = [user.id, selectedUser._id].sort().join("-");
  socket.emit("joinRoom", room);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`http://localhost:8000/messages/${selectedUser._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!response.ok) throw new Error("Failed to fetch messages");
      const data = await response.json();
      setMessages(data);
      
      await fetch(`http://localhost:8000/messages/mark-as-read/${selectedUser._id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
    } catch (error) {
      console.error(error);
    }
  };

  fetchMessages();
}, [user, selectedUser]);



  const handleImageUpload = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await fetch("http://localhost:8000/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (data.imageUrl) {
      setImage(data.imageUrl); // Store uploaded image URL
      console.log("Image uploaded:", data.imageUrl);
    }
  } catch (error) {
    console.error("Image upload failed:", error);
  }
};

  
  
   // Handle Image Selection and Preview
  const handleImageChange = async(e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file)); // Generate preview
      await handleImageUpload(file);
    }
  };

   // Remove Selected Image
  const removeImage = () => {
    setImage(null);
    setPreview(null);
  };

  useEffect(() => {
    socket.on("newMessage", (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    });
    return () => socket.off("newMessage");
  }, [selectedUser]);

  const sendMessage = async () => {
    if (!messageText.trim() && !image) return;

  if (!user || !user.id) {
  console.error("Error: User not authenticated");
  return;
}

if (!selectedUser || !selectedUser._id) {
  console.error("Error: No selected user to chat with");
  return;
    }
    
    
    const formData = new FormData();
    formData.append("senderId", user.id);
    formData.append("receiverId", selectedUser._id);
    if (messageText.trim()) formData.append("message", messageText);
    if (image) formData.append("image", image);

    try {
      const response = await fetch("http://localhost:8000/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to send message");
      const savedMessage = await response.json();

      socket.emit("sendMessage", savedMessage);
    } catch (error) {
      res.json(error);
    }

    setMessageText("");
    setImage(null);
    setPreview(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-black">
      <div className="flex items-center p-4 bg-black shadow">
        <FiArrowLeft className="text-2xl cursor-pointer text-white" onClick={() => navigate("/messages")} />
        <h2 className="text-white flex items-center text-lg font-bold ml-4"> <img src={selectedUser.profilePicture } className="w-8 h-8 mr-2 rounded-full"/> {selectedUser?.username || "Chat"}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === user.id ? "justify-end" : "justify-start"}`}>
            {msg.image ? (
              <img src={msg.image} alt="Sent" className="max-w-xs rounded-lg mb-2" />
            ) : (
              <p className={`p-2 rounded-lg text-sm max-w-xs mb-1.5 ${msg.sender === user.id ? "bg-blue-500 text-white" : "bg-white"}`}>{msg.message}</p>
            )}
          </div>
        ))}
      </div>
      <div className="chat-input flex p-4 bg-black shadow">

        {/* /image preview/ */}

         {preview && (
          <div className="relative mb-2">
            <img src={preview} alt="Preview" className="w-24 h-24 rounded-lg" />
            <FiX className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full cursor-pointer" onClick={removeImage} />
          </div>
        )}

        {/* //input and send button */}
        <label className="cursor-pointer relative">
          <FiPlus className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xl cursor-pointer" />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="opacity-0 w-10 h-10"
          />
        </label>


        <input
          type="text"
          className="text-white flex-1 p-2 border-2 border-white rounded-lg"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type a message..."
        />
        <button className="bg-blue-500 text-white px-4 py-2 ml-2 rounded-lg cursor-pointer" onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};
