import Users from "../models/users.js";
import Conversations from "../models/conversations.js";

const getConversation = async (req, res) => {
  try {
    const { _id: senderId } = req.user;
    const conversations = await Conversations.find({
      usergroup: { $in: [senderId] },
    });
    const userConversationsIDs = [];
    conversations.forEach((conversation) => {
      conversation.usergroup.map((item) => {
        if (item.valueOf() !== senderId) userConversationsIDs.push(item);
      });
    });
    const userConversations = await Users.find({
      _id: { $in: userConversationsIDs },
    })
      .select("-password")
      .select("-username");
    res.status(200).send({ userConversations });
  } catch (e) {
    res
      .status(500)
      .send({ isError: true, error: "Error occured in login controller" });
  }
};

export default getConversation;
