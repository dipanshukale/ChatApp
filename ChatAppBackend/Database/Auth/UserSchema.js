import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
	username: { type: String, required: true },
	email: { type: String, required:true,unique: true },
	password: { type: String, required: true},
	profilePicture: { type: String, default: "" },
	bio: { type: String, default: "" },
	followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
	following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

const User = mongoose.model("User", UserSchema);
export default User;
