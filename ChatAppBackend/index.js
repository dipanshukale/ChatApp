import "../ChatAppBackend/Database/connection.js";
import express from "express";
import { config } from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import http from "http";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "cloudinary"
import cookieParser from "cookie-parser";
import User from "../ChatAppBackend/Database/Auth/UserSchema.js";
import authenticate  from "../ChatAppBackend/middleware/authenticate.js";
import Message from "./Database/models/MessageSchema.js";

config({ path: "./config.env" });

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
	cors: {
		origin: "http://localhost:5173",
		credentials: true,
	},
});

// Middleware
app.use(
	cors({
		origin: ["http://localhost:5173"],
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE"],
		allowedHeaders: ["Content-Type", "Authorization"],
	})
);

cloudinary.v2.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});



const storage = new CloudinaryStorage({
	cloudinary: cloudinary.v2,
	params: {
		folder: "profile_pictures",
		format: async (req, file) => "jpeg", 
		public_id: (req, file) => Date.now() + "-" + file.originalname,
	},
});


const upload = multer({ storage: storage });


app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());


io.on("connection", (socket) => {
	socket.on("joinRoom", (room) => {
		socket.join(room);
	});

	socket.on("sendMessage", async (message) => {
		const room = [message.senderId, message.receiverId].sort().join("-");
		io.to(room).emit("newMessage", message);
	});

	socket.on("disconnect", () => {
	});
});

// Signup route
app.post("/signup", async (req, res) => {
	try {
		const { username, email, password } = req.body;
		const hashedPassword = await bcrypt.hash(password, 10);
		const newUser = new User({ username, email, password: hashedPassword });

		await newUser.save();
		res.status(201).json({ message: "User registered successfully" });
	} catch (error) {
		res.status(500).json({ error: "Error signing up user" });
	}
});

// Login route
app.post("/login", async (req, res) => {
	try {
		const { email, password } = req.body;
		const user = await User.findOne({ email });

		if (!user) return res.status(400).json({ error: "User not found" });

		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) return res.status(400).json({ error: "Invalid password" });

		const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
			expiresIn: "1d",
		});

		res.cookie("token", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
		});
		res.json({
			token,
			user: {
				id: user._id,
				username: user.username,
				email: user.email,
				followers: user.followers,
				following: user.following,
			},
		});
	} catch (error) {
		res.status(500).json({ error: "Error logging in user" });
	}
});

//logut
app.post("/logout", (req, res) => {
	 try {
			const token = req.headers.authorization?.split(" ")[1];
			if (!token) return res.status(401).json({ message: "Unauthorized" });

			res.json({ message: "Logged out successfully" });
		} catch (error) {
			res.status(500).json({ message: "Internal server error" });
		}
})

// Follow user route
app.post("/follow/:id", authenticate, async (req, res) => {
	try {
		const loggedInUser = await User.findById(req.user.id);
		const userToFollow = await User.findById(req.params.id);

		if (!userToFollow)
			return res.status(404).json({ message: "User not found" });

		if (!loggedInUser.following.includes(userToFollow._id)) {
			loggedInUser.following.push(userToFollow._id);
			await loggedInUser.save();
		}

		if (!userToFollow.followers.includes(loggedInUser._id)) {
			userToFollow.followers.push(loggedInUser._id);
			await userToFollow.save();
		}

		res.json({ message: `You are now following ${userToFollow.username}` });
	} catch (error) {
		res.status(500).json({ message: "Server error" });
	}
});


app.post("/upload-profile-pic", authenticate,
	upload.single("profilePic"),
	async (req, res) => {

		 try {
				if (!req.file || !req.file.path) {
					return res.status(400).json({ error: "No file uploaded" });
				}

				const user = await User.findById(req.user.id);
				if (!user) {
					return res.status(404).json({ error: "User not found" });
				}

				user.profilePicture = req.file.path;
				await user.save();

				return res.json({success: true, user});
			} catch (error) {
				console.error("Error updating profile picture:", error);
				res.status(500).json({ error: "Server error" });
			}


	}
);

// Profile route
app.get("/profile", authenticate, async (req, res) => {
	try {
		const user = await User.findById(req.user._id).select("-password");
		res.json(user);
	} catch (error) {
		res.status(500).json({ message: "Server error" });
	}
});

// Fetch user posts
app.get("/posts/:userId", async (req, res) => {
	try {
		const posts = await User.find({ userId: req.params.userId });
		res.json(posts);
	} catch (error) {
		res.status(500).json({ message: "Error fetching posts" });
	}
});

// Get all users (for feed)
app.get("/users", authenticate, async (req, res) => {
	try {
		const users = await User.find({ _id: { $ne: req.user.id } }).select(
			"_id username profilePicture"
		);
		res.json(users);
	} catch (error) {
		res.status(500).json({ message: "Server Error" });
	}
});

app.get("/following-list", authenticate, async (req, res) => {
	try {

		if (!req.user || !req.user.following || req.user.following.length === 0) {
			return res.json({ following: [] });
		}

		const users = await User.find({ _id: { $in: req.user.following } }).select(
			"_id username profilePicture"
		);

		res.json({ following: users });
	} catch (error) {

		if (!res.headersSent) {
			res.status(500).json({ message: "Internal server error" });
		}
	}
});

app.post("/send", authenticate, upload.single("image"), async (req, res) => {
    try {
       
        const { senderId, receiverId, message } = req.body;

        if (!senderId || !receiverId) {
            return res.status(400).json({ error: "Missing senderId or receiverId" });
        }

        let imagePath = req.file ? req.file.path : null;

        const newMessage = new Message({
            sender: senderId,
            receiver: receiverId,
            message: message || "",
            image: imagePath,
        });

        await newMessage.save();
        io.to([senderId, receiverId].sort().join("-")).emit("newMessage", newMessage);

        res.json(newMessage);
    } catch (error) {
        res.status(500).json({ message: "Error sending message" });
    }
});



// API to upload image
app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  res.json({ imageUrl: `${req.file.filename}` });
});

//messages unread
app.get("/messages/unread", authenticate, async (req, res) => {
	const userId = req.user.id;
	const unreadMessages = await Message.countDocuments({
		receiver: userId,
		read: false,
	});
	res.json({ count: unreadMessages });
});


//mark as read
app.put("/messages/mark-as-read/:senderId", authenticate, async (req, res) => {
	const userId = req.user.id; // Logged-in user (receiver)
	const senderId = req.params.senderId; // The person who sent the messages

	try {
		await Message.updateMany(
			{ sender: senderId, receiver: userId, read: false },
			{ $set: { read: true } }
		);

		res.json({ success: true, message: "Messages marked as read" });
	} catch (error) {
		res.status(500).json({ error: "Failed to mark messages as read" });
	}
});




app.get("/messages/:receiverId", authenticate, async (req, res) => {
	try {
		const messages = await Message.find({
			$or: [
				{ sender: req.user.id, receiver: req.params.receiverId },
				{ sender: req.params.receiverId, receiver: req.user.id },
			],
		}).sort("timestamp");
		res.json(messages);
	} catch (error) {
		res.status(500).json({ message: "Error fetching messages" });
	}
});

// Start server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
