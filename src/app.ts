import express from "express";
import cors from "cors";
import { router } from "./routes/index.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { requestLogger } from "./utils/logger.js";

const app = express();

// Core middlewares
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Routes
app.use("/api/v1", router);

// Global error handler
app.use(errorHandler);

export { app };
