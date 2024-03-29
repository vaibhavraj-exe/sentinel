import express from "express";
import userController from "../controllers/user.controller.js";
import verifyAuth from "../middlewares/auth.middleware.js";

const userRouter = express.Router();

userRouter.get("/", verifyAuth, userController);

export default userRouter;
