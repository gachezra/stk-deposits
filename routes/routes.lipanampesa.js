import express from "express";
const router = express.Router();
import {
  initiateSTKPush,
  initiatePayment,
} from "../controllers/controllers.lipanampesa.js";
import { accessToken } from "../middlewares/middlewares.generateAccessToken.js";
import { apiKeyAuth } from "../middlewares/apiKeyAuth.js";

router.route("/stkPush").post(apiKeyAuth, accessToken, initiateSTKPush);
router.route("/initiatePayment").post(accessToken, initiatePayment);

export default router;
