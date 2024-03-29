import mongoose from "mongoose";

const MesssageScehma = new mongoose.Schema(
  {
    senderID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      require: true,
    },
    recieverID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      require: true,
    },
    messageText: {
      type: String,
      require: true,
    },
    fileUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

const Messages = mongoose.model("Messages", MesssageScehma);

export default Messages;
