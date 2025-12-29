import { Router } from "express";
import { registerRouter, registerSwagger } from "./auth/registerRouter";
import { loginRouter, loginSwagger } from "./auth/loginRouter";
import { logoutRouter, logoutSwagger } from "./auth/logoutRouter";
import { meRouter, meSwagger } from "./auth/meRouter";

const v1AuthRouter = Router();

const v1AuthRouterSwagger = {
  '/v1/auth/register': registerSwagger,
  '/v1/auth/login': loginSwagger,
  '/v1/auth/logout': logoutSwagger,
  '/v1/auth/me': meSwagger,
};

v1AuthRouter.use('/auth/register', registerRouter);
v1AuthRouter.use('/auth/login', loginRouter);
v1AuthRouter.use('/auth/logout', logoutRouter);
v1AuthRouter.use('/auth/me', meRouter);

export { v1AuthRouter, v1AuthRouterSwagger };
