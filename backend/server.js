import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";

const app = express();
const PORT = process.env.PORT || 3000;


// MIDDLE LAYERS
app.use(express.json());
app.use(cors()); // helps with CORS related errors
app.use(helmet()); // helmet is a security middleware that helps you protect your app by setting various HTTP headers
app.use(morgan("dev")); // log requests to the console


app.get("/api/products", (req, res) => {
    console.log(res.getHeaders());
    res.send("Hello from the test route");
});

app.listen(PORT, () => {
    console.log("Server is running on port " + PORT);
});

