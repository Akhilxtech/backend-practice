import ApiResponse from "../../common/utils/Api-response.js"
import { join} from "path"
import fs from "fs"
import { createPublicKey } from "crypto"
const serviceDiscovery = (req, res) => {
    try {
        const issuer = process.env.BASE_URL;
        ApiResponse.ok(res, "Service Discovery", {
            issuer: issuer,
            authorization_endpoint: `${issuer}/api/auth/login`,
            token_endpoint: `${issuer}/api/auth/refresh`,
            userinfo_endpoint: `${issuer}/api/auth/getMe`,
            jwks_uri: `${issuer}/.well-known/keys`,
            
            response_types_supported: ["token"],
            
            grant_types_supported: [
                "authorization_code",
                "refresh_token"
            ],
            
            scopes_supported: ["openid", "email", "profile"],
            
            claims_supported: ["id", "email", "role", "iat", "exp"],
            
            id_token_signing_alg_values_supported: ["RS256"],
            
            subject_types_supported: ["public"],
        })
    } catch (error) {
        console.log("error sending service discovery");
    }
}

const publicPem=fs.readFileSync(join(process.cwd(),"src/modules/oidc/keys/public.pem"));
const publicKey=createPublicKey(publicPem).export({format:"jwk"});

const getJwks = (req, res) => {
    try {
        res.json({
            keys: [{ ...publicKey, use: "sig", alg: "RS256", kid: "key-1" }]
        })
    } catch (error) {
        console.log("error sending jwks");
    }
}

export { 
    serviceDiscovery,
    getJwks
};

