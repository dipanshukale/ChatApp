import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

const ProfilePage = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [newUsername, setNewUsername] = useState("");
  const [bio, setBio] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setProfileData(user);
      setNewUsername(user.username || "");
      setBio(user.bio || "");
      setIsLoading(false);
    }
  }, [user]);

  const handleEditProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const response = await fetch("http://localhost:8000/update-profile", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ username: newUsername, bio }),
      });

      if (!response.ok) throw new Error("Profile update failed");

      const updatedUser = await response.json();
      setUser(updatedUser.user);
      localStorage.setItem("user", JSON.stringify(updatedUser.user));
    } catch (error) {
      res.json(error);
    }
  };

  const handleProfilePicChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profilePic", file);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const response = await fetch("http://localhost:8000/upload-profile-pic", {
        method: "POST",
        body: formData,
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error(`Upload failed: ${response.status}`);

      const updatedUser = await response.json();
      setUser(updatedUser.user);
      localStorage.setItem("user", JSON.stringify(updatedUser.user));
    } catch (error) {
       res.json(error);
    }

    event.target.value = "";
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("http://localhost:8000/logout", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}` 
        },
      });

      if (!response.ok) throw new Error("Logout failed");

      // Clear user data
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);

      // Redirect to login page
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (isLoading) return <p>Loading profile...</p>;

  return (
    <div className="max-w-lg mx-auto p-12 bg-black shadow-md rounded-lg mt-36">
      {profileData ? (
        <div className="flex flex-col items-center relative">
          {/* Profile Picture */}
          <img
            src={profileData.profilePicture || "./profile.jpg"}
            alt="profile"
            className="w-24 h-24 rounded-full border object-cover"
            onError={(e) => {
              e.target.src = "./profile.jpg";
              console.error("Error loading profile picture:", profileData.profilePicture);
            }}
          />

          {/* Upload Profile Picture Button */}
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleProfilePicChange}
          />
          <button
            onClick={() => document.getElementById("file-upload").click()}
            className="mt-2 bg-gray-300 px-4 py-2 rounded-full cursor-pointer"
          >
            Change Picture
          </button>

          {/* Profile Info */}
          <h2 className="text-xl font-bold mt-2 text-white">{profileData.username}</h2>
          <p className="text-white">{profileData.email}</p>

          {/* Followers & Following */}
          <div className="mt-4 flex gap-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white">{profileData.followers?.length || 0}</h3>
              <p className="text-sm text-white">Followers</p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white">{profileData.following?.length || 0}</h3>
              <p className="text-sm text-white">Following</p>
            </div>
          </div>

          {/* Edit Profile Section */}
          <div className="mt-4 w-full">
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Write your bio here..."
              className="w-full p-2 border rounded text-white border-white"
            />
            <button
              onClick={handleEditProfile}
              className="w-full bg-blue-500 text-white p-2 rounded mt-2"
            >
              Update Profile
            </button>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 text-white p-2 rounded mt-4 cursor-pointer"
          >
            Logout
          </button>
        </div>
      ) : (
        <p>Profile not found.</p>
      )}
    </div>
  );
};

export default ProfilePage;
