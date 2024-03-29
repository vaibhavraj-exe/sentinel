import jwt from "jsonwebtoken";
import Users from "../models/users.js";

const setCookies = async (userID, res) => {
  const user = await Users.findOne({ _id: userID });
  const jwtToken = jwt.sign(
    {
      _id: user._id,
      name: user.name,
      username: user.username,
      gender: user.gender,
    },
    process.env.TOKEN_KEY,
    { expiresIn: "15hr" }
  );
  res.cookie("token", jwtToken, {
    maxAge: 15 * 60 * 60 * 1000,
    secure: false,
    httpOnly: false,
  });
};

export { setCookies };
