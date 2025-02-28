import React, { useEffect, useState } from "react";
import { FiMessageCircle } from "react-icons/fi";
import { AiOutlineHome, AiOutlineUser, AiOutlinePlusCircle } from "react-icons/ai";
import { MdOutlineSlowMotionVideo } from "react-icons/md";
import { useNavigate } from "react-router-dom";

const Home = () => {
	const [users, setUsers] = useState([]);
	const [following, setFollowing] = useState([]);
	const [newMessagesCount, setNewMessagesCount] = useState(0);

	useEffect(() => {
		const fetchMessagesCount = () => {
			fetch("https://chatapp-backend-46f1.onrender.com/messages/unread", {
				method: "GET",
				credentials: "include",
				headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
			})
				.then((res) => res.json())
				.then((data) => setNewMessagesCount(data.count))
				.catch((error) => console.error("Error fetching messages:", error));
		};

		fetchMessagesCount();

		const interval = setInterval(fetchMessagesCount, 10000);
		return () => clearInterval(interval);
	}, []);

	// Fetch users & following list
	useEffect(() => {
		fetch("https://chatapp-backend-46f1.onrender.com/users", {
			method: "GET",
			credentials: "include",
			headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
		})
			.then((res) => res.json())
			.then((data) => setUsers(data));

		fetch("https://chatapp-backend-46f1.onrender.com/profile", {
			method: "GET",
			credentials: "include",
			headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
		})
			.then((res) => res.json())
			.then((data) => setFollowing(data.following));
	}, []);

	const handleFollow = async (id) => {
		await fetch(`https://chatapp-backend-46f1.onrender.com/follow/${id}`, {
			method: "POST",
			credentials: "include",
			headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
		});

		setFollowing([...following, id]);
	};

	return (
		<div className="pt-16 pb-16 h-screen-fit  bg-black">
			<Navbar newMessagesCount={newMessagesCount} />
			<div className="max-w-md  mx-auto p-4">
				{users.length > 0 ? (
					users.map((user) => (
						<PostCard
							key={user._id}
							user={user}
							following={following}
							handleFollow={handleFollow}
						/>
					))
				) : (
					<p className="text-center text-gray-500 bg-black">No users found.</p>
				)}
			</div>

			<BottomNav />
		</div>
	);
};

// Navbar Component
function Navbar({ newMessagesCount }) {
	const navigate = useNavigate();

	return (
		<nav className="bg-black shadow-md p-3 fixed top-0 w-full z-50">
			<div className="max-w-5xl mx-auto flex justify-between items-center">
				{/* Left: Logo */}
				<div className="flex flex-col items-center  cursor-pointer" onClick={() => navigate("/")}>
					<img src="./chat.jpg" alt="logo" className="w-16 h-12 rounded-[500px] backdrop-blur-sm" />
				</div>

				{/* Center: App Name */}
				<h1 className="text-2xl flex flex-row font-serif font-bold mr-2.5 text-white items-center">Convo <img src="./chat.jpg" className="w-12 h-10"/></h1>

				{/* Right: Chat Icon with Notification Badge */}
				<div className="relative cursor-pointer" onClick={() => navigate("/messages")}>
					<FiMessageCircle className="text-3xl text-white" />
					{newMessagesCount > 0 && (
						<span className="absolute -top-2 -right-2 bg-red-500 text-black text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
							{newMessagesCount}
						</span>
					)}
				</div>
			</div>
		</nav>
	);
}

// Post Card Component
const PostCard = ({ user, following, handleFollow }) => {
	const isFollowing = following.includes(user._id);
	const navigate = useNavigate();

	return (
		<div className="bg-black shadow-lg rounded-lg overflow-hidden my-4 p-3">
			<div className="flex items-center justify-between border-1 border-white p-5 rounded-4xl">
				<div className="flex items-center">
					<img
						src={user.profilePicture || "./profile.jpg"}
						className="w-10 h-10 bg-gray-300 rounded-full"
						alt="profile"
					/>
					<p className="ml-3 font-semibold text-white">{user.username}</p>
				</div>

				{isFollowing ? (
					<button className="bg-gray-300 text-black px-3 py-1 rounded text-sm">
						Following
					</button>
				) : (
					<button
						className="bg-blue-500 text-white px-3 py-1 rounded text-sm cursor-pointer"
						onClick={() => handleFollow(user._id)}
					>
						Follow
					</button>
				)}
			</div>

			<div className="p-3 flex justify-between">
				<p className="text-sm text-white">
					<span className="font-semibold text-white">{user.username}</span> Just joined
					Convo!
				</p>
			</div>
		</div>
	);
};

// Bottom Navigation
function BottomNav() {
	const navigate = useNavigate();

	return (
		<div className="bg-black fixed bottom-0 w-full p-3 flex justify-around text-2xl text-gray-700 border-t">
			<AiOutlineHome
				className="text-white cursor-pointer hover:text-gray-400"
				onClick={() => navigate("/")}
			/>
			<MdOutlineSlowMotionVideo
				className="text-white cursor-pointer hover:text-gray-400"
				onClick={() => navigate("/reels")}
			/>
			<AiOutlinePlusCircle className="text-white cursor-pointer hover:text-gray-400" onClick={() => navigate("/post")}/>
			<AiOutlineUser
				className="text-white cursor-pointer hover:text-gray-400"
				onClick={() => navigate("/profile")}
			/>
		</div>
	);
}

export default Home;
