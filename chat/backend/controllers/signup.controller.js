import bcrypt from "bcrypt";
import Users from "../models/users.js";
import { setCookies } from "../utility/cookies.js";

const signupController = async (req, res) => {
  const { name, username, gender, password, randomAvatar, location } = req.body;
  try {
    if (name && username && gender && password) {
      const postData = {
        features: [
          "default_profile",
          "default_profile_image",
          "favourites_count",
          "followers_count",
          "friends_count",
          "geo_enabled",
          "verified",
          "average_tweets_per_day",
          "account_age_days",
        ],
        account_info: [
          randomAvatar ? 1 : 0,
          randomAvatar ? 1 : 0,
          0,
          0,
          0,
          location ? 1 : 0,
          0,
          0,
          0,
        ],
      };

      const accountCheckResponse = await fetch(
        "http://localhost:8000/check-account",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(postData),
        }
      );

      console.log({ accountCheckResponse });

      if (accountCheckResponse.ok) {
        const accountCheckData = await accountCheckResponse.json();
        const { credits } = accountCheckData;

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
            credits: credits || 1,
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
          res.status(400).send({ isError: true, error: "User already exists" });
        }
      } else {
        res.status(accountCheckResponse.status).send({
          isError: true,
          error: "Failed to check account",
        });
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
      .send({ isError: true, error: "Error occurred in signup controller" });
  }
};

export default signupController;
