import { RegisterUserUseCase } from "../../../application/usecases/auth/register/RegisterUserUseCase";
import { SignupUseCase } from "../../../application/usecases/auth/signup/SignupUseCase";
import { LoginUserUseCase } from "../../../application/usecases/auth/login/LoginUserUseCase";
import { LogoutUserUseCase } from "../../../application/usecases/auth/logout/LogoutUserUseCase";
import { RefreshTokenUseCase } from "../../../application/usecases/auth/refresh/RefreshTokenUseCase";
import { ConfirmEmailUseCase } from "../../../application/usecases/auth/confirmEmail/ConfirmEmailUseCase";
import { ForgotPasswordUseCase } from "../../../application/usecases/auth/forgotPassword/ForgotPasswordUseCase";
import { ResendVerificationUseCase } from "../../../application/usecases/auth/resendVerification/ResendVerificationUseCase";
import { ResetPasswordUseCase } from "../../../application/usecases/auth/resetPassword/ResetPasswordUseCase";
import { GoogleSignInUseCase } from "../../../application/usecases/auth/socialGoogle/GoogleSignInUseCase";
import { RegisterUserController } from "../../../presentation/controllers/Auth/RegisterUserController";
import { SignupController } from "../../../presentation/controllers/Auth/SignupController";
import { LoginUserController } from "../../../presentation/controllers/Auth/LoginUserController";
import { LogoutUserController } from "../../../presentation/controllers/Auth/LogoutUserController";
import { RefreshTokenController } from "../../../presentation/controllers/Auth/RefreshTokenController";
import { GetMeController } from "../../../presentation/controllers/Auth/GetMeController";
import { ConfirmEmailController } from "../../../presentation/controllers/Auth/ConfirmEmailController";
import { ForgotPasswordController } from "../../../presentation/controllers/Auth/ForgotPasswordController";
import { ResendVerificationController } from "../../../presentation/controllers/Auth/ResendVerificationController";
import { ResetPasswordController } from "../../../presentation/controllers/Auth/ResetPasswordController";
import { GoogleSignInController } from "../../../presentation/controllers/Auth/GoogleSignInController";
import { userRepo } from "../typeOrmRepoFactory";
import { tokenService } from "../../../infra/services/TokenService";
import { googleTokenVerifier } from "../../../infra/services/GoogleTokenVerifier";
import { emailService } from "../../../infra/services/email/ResendEmailService";
import { AccountEmailEmitter } from "../../../application/services/AccountEmailEmitter";
import { verificationTokenRepo, auditLog } from "../typeOrmRepoFactory";

const accountEmailEmitter = new AccountEmailEmitter(emailService, verificationTokenRepo);

// Use Cases
const registerUserUseCase = new RegisterUserUseCase(userRepo, tokenService, accountEmailEmitter);
const signupUseCase = new SignupUseCase(userRepo, tokenService, accountEmailEmitter);
const loginUserUseCase = new LoginUserUseCase(userRepo, tokenService, auditLog);
const logoutUserUseCase = new LogoutUserUseCase(tokenService);
const refreshTokenUseCase = new RefreshTokenUseCase(tokenService, userRepo);
const confirmEmailUseCase = new ConfirmEmailUseCase(userRepo, verificationTokenRepo);
const forgotPasswordUseCase = new ForgotPasswordUseCase(userRepo, accountEmailEmitter);
const resendVerificationUseCase = new ResendVerificationUseCase(userRepo, accountEmailEmitter);
const resetPasswordUseCase = new ResetPasswordUseCase(userRepo, verificationTokenRepo, auditLog);
const googleSignInUseCase = new GoogleSignInUseCase(userRepo, tokenService, googleTokenVerifier, auditLog);

// Controllers
const registerUserController = new RegisterUserController(registerUserUseCase);
const signupController = new SignupController(signupUseCase);
const loginUserController = new LoginUserController(loginUserUseCase);
const logoutUserController = new LogoutUserController(logoutUserUseCase);
const refreshTokenController = new RefreshTokenController(refreshTokenUseCase);
const getMeController = new GetMeController(userRepo);
const confirmEmailController = new ConfirmEmailController(confirmEmailUseCase);
const forgotPasswordController = new ForgotPasswordController(forgotPasswordUseCase);
const resendVerificationController = new ResendVerificationController(resendVerificationUseCase);
const resetPasswordController = new ResetPasswordController(resetPasswordUseCase);
const googleSignInController = new GoogleSignInController(googleSignInUseCase);

export {
  registerUserController,
  signupController,
  loginUserController,
  logoutUserController,
  refreshTokenController,
  getMeController,
  confirmEmailController,
  forgotPasswordController,
  resendVerificationController,
  resetPasswordController,
  googleSignInController,
};
