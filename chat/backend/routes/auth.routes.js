import express from "express";
import signupController from "../controllers/signup.controller.js";
import loginController from "../controllers/login.controller.js";
import logoutController from "../controllers/logout.controller.js";

const authRouter = express.Router();

authRouter.post('/signup', signupController);
authRouter.post('/login', loginController);
authRouter.get('/logout', logoutController);

export default authRouter;