import express from "express";
const router = express.Router();
import { initiateSTKPush } from "../controllers/controllers.lipanampesa.js";
import { accessToken } from "../middlewares/middlewares.generateAccessToken.js";
import { apiKeyAuth } from "../middlewares/apiKeyAuth.js";

router.route("/stkPush").post(apiKeyAuth, accessToken, initiateSTKPush);
// router.route("/withdraw/:userId").post(apiKeyAuth, accessToken, initiateB2CTransaction);
// router
//   .route("/confirmPayment/:CheckoutRequestID")
//   .post(accessToken, confirmPayment);

export default router;
