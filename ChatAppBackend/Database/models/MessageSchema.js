import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
	sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
	receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
	message: { type: String, default: "" },
	image: { type: String, default: null},
	timestamp: { type: Date, default: Date.now },
	read: { type: Boolean, default: false },
});

const Message = mongoose.model("Message", MessageSchema);
export default Message;
