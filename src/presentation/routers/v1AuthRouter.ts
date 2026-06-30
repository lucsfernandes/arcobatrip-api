import { Router } from "express";
import { registerRouter, registerSwagger } from "./auth/registerRouter";
import { signupRouter, signupSwagger } from "./auth/signupRouter";
import { loginRouter, loginSwagger } from "./auth/loginRouter";
import { logoutRouter, logoutSwagger } from "./auth/logoutRouter";
import { refreshTokenRouter, refreshTokenSwagger } from "./auth/refreshTokenRouter";
import { meRouter, meSwagger } from "./auth/meRouter";
import { confirmEmailRouter, confirmEmailSwagger } from "./auth/confirmEmailRouter";
import { forgotPasswordRouter, forgotPasswordSwagger } from "./auth/forgotPasswordRouter";
import { resendVerificationRouter, resendVerificationSwagger } from "./auth/resendVerificationRouter";
import { resetPasswordRouter, resetPasswordSwagger } from "./auth/resetPasswordRouter";

const v1AuthRouter = Router();

const v1AuthRouterSwagger = {
  '/v1/auth/register': registerSwagger,
  '/v1/auth/signup': signupSwagger,
  '/v1/auth/login': loginSwagger,
  '/v1/auth/logout': logoutSwagger,
  '/v1/auth/refresh': refreshTokenSwagger,
  '/v1/auth/me': meSwagger,
  '/v1/auth/verify-email': confirmEmailSwagger,
  '/v1/auth/forgot-password': forgotPasswordSwagger,
  '/v1/auth/resend-verification': resendVerificationSwagger,
  '/v1/auth/reset-password': resetPasswordSwagger,
};

v1AuthRouter.use('/auth/register', registerRouter);
v1AuthRouter.use('/auth/signup', signupRouter);
v1AuthRouter.use('/auth/login', loginRouter);
v1AuthRouter.use('/auth/logout', logoutRouter);
v1AuthRouter.use('/auth/refresh', refreshTokenRouter);
v1AuthRouter.use('/auth/me', meRouter);
v1AuthRouter.use('/auth/verify-email', confirmEmailRouter);
v1AuthRouter.use('/auth/forgot-password', forgotPasswordRouter);
v1AuthRouter.use('/auth/resend-verification', resendVerificationRouter);
v1AuthRouter.use('/auth/reset-password', resetPasswordRouter);

export { v1AuthRouter, v1AuthRouterSwagger };
