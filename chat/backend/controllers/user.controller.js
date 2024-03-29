import Users from "../models/users.js";

const userController = async (req, res) => {
  const { _id: senderID } = req.user;
  try {
    const users = await Users.find({ _id: { $ne: senderID } })
      .select("-password")
      .select("-username");
    res.status(200).send({ users });
  } catch (e) {
    res.status(400).send({ isError: true, error: "Error in user controllers" });
  }
};

export default userController;
