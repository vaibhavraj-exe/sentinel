import jwt from "jsonwebtoken";

const verifyAuth = (req, res, next) => {
  const { token } = req.cookies;
  if (token) {
    try {
      const user = jwt.verify(token, process.env.TOKEN_KEY);
      if (user._id === req.params.recieverID) {
        return res
          .status(400)
          .send({
            isError: true,
            error: "You are not authorized to send messages",
          });
      }
      req.user = user;
      next();
    } catch (e) {
      res
        .status(400)
        .send({ isError: true, error: "Error in auth middleware" });
    }
  } else {
    res.status(400).send({ isError: true, error: "You are not authorized" });
  }
};

export default verifyAuth;
