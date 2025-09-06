import express from "express";
import cors from "cors";
import { v1Router } from "../../presentation/middlewares/routes";
import "reflect-metadata";

const app = express();
app.use(express.json());

app.use(cors());

app.get('/health', (_req, res) => {
  console.info('Health check is OK!');
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

app.use('/api/v1', v1Router);

export default app;
