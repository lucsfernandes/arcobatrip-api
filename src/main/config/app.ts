import express from "express";
import cors from "cors";
import { v1Router } from "../../presentation/middlewares/routes";
import "reflect-metadata";

const app = express();
app.use(express.json());

app.use(cors());

app.use('/api/v1', v1Router);

export default app;
