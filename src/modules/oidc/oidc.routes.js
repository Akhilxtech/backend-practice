import { Router } from "express";
import * as oidc from "./oidc.controller.js";

const router=Router();

router.get("/.well-known/openid-configuration",oidc.serviceDiscovery);
router.get("/.well-known/keys",oidc.getJwks);

export default router;