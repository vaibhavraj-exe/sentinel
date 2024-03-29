import mongoose from "mongoose";

const ConversationScehma = new mongoose.Schema(
  {
    usergroup: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
      },
    ],
    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Messages",
        default: [],
      },
    ],
  },
  { timestamps: true }
);

const Conversations = mongoose.model("Conversations", ConversationScehma);

export default Conversations;
