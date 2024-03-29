import Conversations from "../models/conversations.js";

const getMessageController = async (req, res) => {
  const { recieverID } = req.params;
  const { _id: senderID } = req.user;

  if (recieverID) {
    try {
      const conversations = await Conversations.findOne({
        usergroup: { $all: [senderID, recieverID] },
      }).populate("messages");

      if (!conversations) return res.status(200).send({ allMessages: [] });

      res.status(200).send({ allMessages: conversations.messages });
    } catch (e) {
      res
        .status(400)
        .send({ isError: true, error: "Error in get message controllers" });
    }
  } else {
    res.status(400).send({ isError: true, error: "Invalid Reciever ID" });
  }
};

export default getMessageController;
