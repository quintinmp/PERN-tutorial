import arcjet, { tokenBucket, shield, detectBot } from "@arcjet/node";
import "dotenv/config";


// init arcjet

export const aj = arcjet({
    key: process.env.ARCJECT_KEY,
    characteristics:["ip.sec"],
    rules: [
        //shield protects from common attacks (SQL injection, XSS, CSRF attacks)
        shield({mode: "LIVE"}),
        detectBot({mode: "LIVE",
            // block all bots except search engines
            allow: [
                "CATEGORY:SEARCH_ENGINE"
                // see full list at arcjet bot list
            ]
        }),
        // rate limiting
        tokenBucket({
            mode: "LIVE",
            refillRate: 5,
            interval: 10,
            capacity: 10
        }),
    ]
})