import jwt from "jsonwebtoken";
import User from "../Database/Auth/UserSchema.js";

const authenticate = async (req, res, next) => {
	try {
		const token = req.header("Authorization").replace("Bearer ", "");
		if (!token) return res.status(401).json({ message: "Unauthorized" });

		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const user = await User.findById(decoded.id).select("-password");
		if (!user) return res.status(401).json({ message: "User not found" });

		req.user = user;
		next();
	} catch (error) {
		res.status(401).json({ message: "Invalid token" });
	}
};

export default authenticate;
