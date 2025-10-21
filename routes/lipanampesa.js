import { Router } from "express";
import { mpesaCallback } from "../controllers/controllers.lipanampesa.js";
import { paymentCallback } from "../controllers/lipanampesa.js";

const router = Router();

router.post("/mpesaCallback/:userId", mpesaCallback);
router.post("/paymentCallback/:userId", paymentCallback);

export default router;
