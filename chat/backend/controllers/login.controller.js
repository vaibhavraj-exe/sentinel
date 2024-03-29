import bcrypt from "bcrypt";
import Users from "../models/users.js";
import { setCookies } from "../utility/cookies.js";

const loginController = async (req, res) => {
  const { username, password } = req.body;
  try {
    if (username && password) {
      const user = await Users.findOne({ username });
      const isPasswordValid = await bcrypt.compare(
        password,
        user?.password || ""
      );

      if (!user || !isPasswordValid) {
        return res
          .status(400)
          .send({ isError: true, error: "Invalid Credentials" });
      }

      await setCookies(user._id, res);

      res.status(200).send({
        user: {
          _id: user._id,
          name: user.name,
          username: user.username,
          gender: user.gender,
          profilepic: user.profilepic,
        },
      });
    } else {
      res.status(400).send({ isError: true, error: "Invalid Credentials" });
    }
  } catch (e) {
    res
      .status(500)
      .send({ isError: true, error: "Error occured in login controller" });
  }
};

export default loginController;
