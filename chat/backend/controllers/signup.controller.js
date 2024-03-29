import bcrypt from "bcrypt";
import Users from "../models/users.js";
import { setCookies } from "../utility/cookies.js";

const signupController = async (req, res) => {
  const { name, username, gender, password, randomAvatar, location } = req.body;
  try {
    if (name && username && gender && password) {
      const nameArray = name.split(" ");
      const isUserExist = await Users.findOne({ username });
      if (!isUserExist) {
        const profilepic = `https://avatar.iran.liara.run/username?username=${
          nameArray.length >= 2 ? `${nameArray[0]}+${nameArray[1]}` : name
        }&length=${nameArray.length === 1 ? 1 : 2}`;

        const newUser = new Users({
          name,
          username,
          gender,
          password: bcrypt.hashSync(password, 10),
          profilepic: randomAvatar ? profilepic : null,
          location: location ? location : null,
        });
        await newUser.save();

        await setCookies(newUser._id, res);

        res.status(201).send({
          message: "User Created",
          user: {
            _id: newUser._id,
            name: newUser.name,
            username: newUser.username,
            gender: newUser.gender,
            profilepic: newUser.profilepic,
          },
        });
      } else {
        res.status(400).send({ isError: true, error: "User already exist" });
      }
    } else {
      res.status(400).send({
        isError: true,
        error: "Invalid User Details, Please enter all required fields",
      });
    }
  } catch (e) {
    res
      .status(500)
      .send({ isError: true, error: "Error occured in signup controller" });
  }
};

export default signupController;
