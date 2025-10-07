import express from "express";
const router = express.Router();
import {
  initiateSTKPush,
  initiateB2CTransaction,
  confirmPayment,
} from "../controllers/controllers.lipanampesa.js";
import { accessToken } from "../middlewares/middlewares.generateAccessToken.js";

router.route("/stkPush").post(accessToken, initiateSTKPush);
router.route("/withdraw/:userId").post(accessToken, initiateB2CTransaction);
router
  .route("/confirmPayment/:CheckoutRequestID")
  .post(accessToken, confirmPayment);

export default router;
