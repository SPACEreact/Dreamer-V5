import express from "express";
import bodyParser from "body-parser";
import imageRouter from "./routes/image";
import soundRouter from "./routes/sound";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

// API routes
app.use("/api/image", imageRouter);
app.use("/api/sound", soundRouter);

// Health
app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

// Error handler (should be last)
app.use(errorHandler);

const port = process.env.PORT ?? 3000;
if (process.env.NODE_ENV !== "test") {
  app.listen(Number(port), () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${port}`);
  });
}

export default app;