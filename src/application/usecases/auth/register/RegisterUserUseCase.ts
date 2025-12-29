import bcrypt from "bcryptjs";
import { IUseCase } from "../../IUseCase";
import { Result } from "../../Result";
import { UseCaseError } from "../../../errors/UseCaseError";
import { IUserRepo } from "../IUserRepo";
import { RegisterUserRequestDTO } from "./RegisterUserRequestDTO";
import { RegisterUserResponseDTO } from "./RegisterUserResponseDTO";
import { ITokenService } from "../ITokenService";
import { dayjs } from "../../../../presentation/utils/dayjs";

export class RegisterUserUseCase implements IUseCase<RegisterUserRequestDTO, RegisterUserResponseDTO> {
  constructor(
    private userRepo: IUserRepo,
    private tokenService: ITokenService
  ) {}

  async execute(request: RegisterUserRequestDTO): Promise<Result<RegisterUserResponseDTO>> {
    const { fullName, phone, email, password, confirmPassword, birthDate } = request;

    // Validar se as senhas coincidem
    if (password !== confirmPassword) {
      return Result.fail(new UseCaseError("As senhas não coincidem", 400));
    }

    // Validar força da senha
    if (password.length < 8) {
      return Result.fail(new UseCaseError("A senha deve ter pelo menos 8 caracteres", 400));
    }

    // Validar data de nascimento (usuário deve ter pelo menos 13 anos)
    const birthDateParsed = dayjs(birthDate);
    const age = dayjs().diff(birthDateParsed, 'year');
    if (age < 13) {
      return Result.fail(new UseCaseError("Usuário deve ter pelo menos 13 anos", 400));
    }

    try {
      // Verificar se email já existe
      const emailExists = await this.userRepo.existsByEmail(email);
      if (emailExists) {
        return Result.fail(new UseCaseError("Este email já está cadastrado", 409));
      }

      // Hash da senha
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Criar usuário
      const user = await this.userRepo.create({
        fullName,
        phone,
        email,
        password: hashedPassword,
        birthDate: birthDateParsed.toDate()
      });

      if (!user) {
        return Result.fail(new UseCaseError("Não foi possível criar o usuário", 500));
      }

      // Gerar token JWT
      const token = this.tokenService.generateToken({
        userId: user.id,
        email: user.email
      });

      return Result.ok({
        user,
        token
      });
    } catch (error: any) {
      return Result.fail(new UseCaseError(error.message || "Erro interno do servidor", 500));
    }
  }
}
