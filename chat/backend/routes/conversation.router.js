import express from "express";
import getConversation from "../controllers/getConversation.controller.js";
import verifyAuth from "../middlewares/auth.middleware.js";

const conversationRouter = express.Router();

conversationRouter.get("/", verifyAuth, getConversation);

export default conversationRouter;
