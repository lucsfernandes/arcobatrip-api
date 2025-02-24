import winston from "winston";
import { loggerConfig } from "./config/logger-transport";

const logger = winston.createLogger({
  ...loggerConfig
});

export default logger;