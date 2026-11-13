import winston from "winston";
import { env } from "./env";
import { logTypeFormat, redactFormat } from "../logging/redact";

const loggerConfig = {
  // LOG_LEVEL: error | warn | info (default) | http | verbose | debug | silly.
  level: env.LOG_LEVEL,
  transports: [new winston.transports.Console()],
  format: winston.format.combine(
    logTypeFormat(),
    // Nothing secret may reach the logs, whoever logs it (password, token,
    // cookie, Authorization, a token in a URL).
    redactFormat(),
    winston.format.timestamp(),
    winston.format.json()
  )
};

export { loggerConfig };
