import winston from "winston";

const loggerConfig = {
  transports: [new winston.transports.Console()],
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  )
};

export { loggerConfig };