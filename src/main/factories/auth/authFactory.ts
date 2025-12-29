import { RegisterUserUseCase } from "../../../application/usecases/auth/register/RegisterUserUseCase";
import { LoginUserUseCase } from "../../../application/usecases/auth/login/LoginUserUseCase";
import { LogoutUserUseCase } from "../../../application/usecases/auth/logout/LogoutUserUseCase";
import { RefreshTokenUseCase } from "../../../application/usecases/auth/refresh/RefreshTokenUseCase";
import { RegisterUserController } from "../../../presentation/controllers/Auth/RegisterUserController";
import { LoginUserController } from "../../../presentation/controllers/Auth/LoginUserController";
import { LogoutUserController } from "../../../presentation/controllers/Auth/LogoutUserController";
import { RefreshTokenController } from "../../../presentation/controllers/Auth/RefreshTokenController";
import { GetMeController } from "../../../presentation/controllers/Auth/GetMeController";
import { userRepo } from "../typeOrmRepoFactory";
import { tokenService } from "../../../infra/services/TokenService";

// Use Cases
const registerUserUseCase = new RegisterUserUseCase(userRepo, tokenService);
const loginUserUseCase = new LoginUserUseCase(userRepo, tokenService);
const logoutUserUseCase = new LogoutUserUseCase(tokenService);
const refreshTokenUseCase = new RefreshTokenUseCase(tokenService);

// Controllers
const registerUserController = new RegisterUserController(registerUserUseCase);
const loginUserController = new LoginUserController(loginUserUseCase);
const logoutUserController = new LogoutUserController(logoutUserUseCase);
const refreshTokenController = new RefreshTokenController(refreshTokenUseCase);
const getMeController = new GetMeController(userRepo);

export {
  registerUserController,
  loginUserController,
  logoutUserController,
  refreshTokenController,
  getMeController
};
