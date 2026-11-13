import app from "./config/app";
import { env } from "./config/env";
import logger from "./logger";
import 'reflect-metadata';
import { auditLog } from "./factories/typeOrmRepoFactory";
import { startAuditPurgeJob } from "./jobs/auditPurgeJob";

app.listen(parseInt(env.PORT), () => logger.info(`Server up and running on port ${env.PORT}...`));

startAuditPurgeJob(auditLog);