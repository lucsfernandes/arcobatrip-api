import app from "./config/app";
import { env } from "./config/env";
import logger from "./logger";
import 'reflect-metadata';

app.listen(parseInt(env.PORT), () => logger.info(`Server up and running on port ${env.PORT}...`));