import express from "express";
import getViolations from "../controllers/getViolation.controller.js";
import appealController from "../controllers/appealViolation.controller.js";
import verifyAuth from "../middlewares/auth.middleware.js";

const violationRouter = express.Router();

violationRouter.get("/:userID", verifyAuth, getViolations);
violationRouter.post("/:violationID/appeal", appealController);

export default violationRouter;
