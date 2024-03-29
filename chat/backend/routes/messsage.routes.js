import multer from "multer";
import express from "express";
import newMessageController from "../controllers/newMessage.controller.js";
import getMessageController from "../controllers/getMessage.controller.js";
import verifyAuth from "../middlewares/auth.middleware.js";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

const messageRouter = express.Router();

messageRouter.post(
  "/send/:recieverID",
  upload.single("file"),
  verifyAuth,
  newMessageController
);
messageRouter.get("/:recieverID", verifyAuth, getMessageController);

export default messageRouter;
