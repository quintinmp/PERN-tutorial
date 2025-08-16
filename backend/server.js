import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";

import dotenv from "dotenv";
import { sql } from "./config/db.js"
import productRoutes from "./routes/productRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;


// MIDDLE LAYERS
app.use(express.json());
app.use(cors()); // helps with CORS related errors
app.use(helmet()); // helmet is a security middleware that helps you protect your app by setting various HTTP headers
app.use(morgan("dev")); // log requests to the console
app.use(async (req, res, next) => { // apply arcjet rate-limit to all routes
    try {
        const decision = await aj.protect(req, {
            requested: 1 // specifies that each request consumes 1 token
        })

        if (decision.isDenied()) {
            if(decision.reason.isRateLimit()) {
                res.status(429).json({error: "too many requests"});
            }
            else if (decision.reason.isBot()) {
            res.status(403).json({ error: "bot access denied"});
            } 
            else {
            res.status(403).json({ error: "Forbidden"});
            }
            return;
        }

        // check for spoofed bots
        if (decision.results.some((results) => result.reason.isBot() && result.reason.isSpoofed())) {
            res.status(403).json({ error: "Spoofed bot detected"});
            return;
        }

        next();

    } catch (error) {
        console.log("Arcject error: ", error);
        next(error);
    }
})


app.use("/api/products", productRoutes);

async function initDB() {
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                image VARCHAR(255) NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
    
        console.log("DB initialized successfully");
    } catch (error) {
        console.log("Error initDB", error);
    }
}

initDB().then(() => {
    app.listen(PORT, () => {
        console.log("Server is running on port " + PORT);
    });
});
