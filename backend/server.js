import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";

import path from "path";
import dotenv from "dotenv";
import { sql } from "./config/db.js";
import { aj } from "./lib/arcjet.js";
import productRoutes from "./routes/productRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.resolve();

// MIDDLE LAYERS
app.use(express.json());
app.use(cors()); // helps with CORS related errors
app.use(helmet({
    contentSecurityPolicy:false,
})); // helmet is a security middleware that helps you protect your app by setting various HTTP headers
app.use(morgan("dev")); // log requests to the console
app.use(async (req, res, next) => { // apply arcjet rate-limit to all routes
    console.log("Arcjet middleware hit!"); // Add this

    try {
        const decision = await aj.protect(req, {
            requested: 1 // specifies that each request consumes 1 token
        })
        console.log("Arcjet decision:", decision.isDenied(), decision.reason); // Add this

        if (decision.isDenied()) {
            console.log("Request denied by Arcjet!"); // Add this

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
        if (decision.results.some((result) => result.reason.isBot() && result.reason.isSpoofed())) {
            res.status(403).json({ error: "Spoofed bot detected"});
            return;
        }
        console.log("Request allowed by Arcjet"); // Add this

        next();

    } catch (error) {
        console.log("Arcjet error: ", error);
        next(error);
    }
})


app.use("/api/products", productRoutes);

if(process.env.NODE_ENV==="production") {
    //serve our react app
    app.use(express.static(path.join(__dirname, "/frontend/dist")));
    app.get("*", (req,res) => {
        res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
    })
}

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
