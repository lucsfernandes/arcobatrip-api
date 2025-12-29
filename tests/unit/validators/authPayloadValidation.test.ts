import { registerPayloadValidation, loginPayloadValidation } from "../../../src/presentation/validators/auth/authPayloadValidation";

describe("authPayloadValidation", () => {
  describe("registerPayloadValidation", () => {
    const validPayload = {
      full_name: "João Silva",
      phone: "11999999999",
      email: "joao@test.com",
      password: "Senha@123",
      confirm_password: "Senha@123",
      birth_date: new Date("1990-01-15")
    };

    describe("Validação de nome", () => {
      it("deve aceitar nome válido", () => {
        const result = registerPayloadValidation.safeParse(validPayload);
        expect(result.success).toBe(true);
      });

      it("deve rejeitar nome com menos de 3 caracteres", () => {
        const result = registerPayloadValidation.safeParse({
          ...validPayload,
          full_name: "Jo"
        });
        expect(result.success).toBe(false);
      });

      it("deve rejeitar nome com mais de 100 caracteres", () => {
        const result = registerPayloadValidation.safeParse({
          ...validPayload,
          full_name: "a".repeat(101)
        });
        expect(result.success).toBe(false);
      });
    });

    describe("Validação de telefone", () => {
      it("deve aceitar telefone válido", () => {
        const result = registerPayloadValidation.safeParse(validPayload);
        expect(result.success).toBe(true);
      });

      it("deve aceitar telefone com formatação", () => {
        const result = registerPayloadValidation.safeParse({
          ...validPayload,
          phone: "+55 (11) 99999-9999"
        });
        expect(result.success).toBe(true);
      });

      it("deve rejeitar telefone com menos de 10 dígitos", () => {
        const result = registerPayloadValidation.safeParse({
          ...validPayload,
          phone: "123456789"
        });
        expect(result.success).toBe(false);
      });
    });

    describe("Validação de email", () => {
      it("deve aceitar email válido", () => {
        const result = registerPayloadValidation.safeParse(validPayload);
        expect(result.success).toBe(true);
      });

      it("deve rejeitar email inválido", () => {
        const result = registerPayloadValidation.safeParse({
          ...validPayload,
          email: "email-invalido"
        });
        expect(result.success).toBe(false);
      });
    });

    describe("Validação de senha", () => {
      it("deve aceitar senha forte", () => {
        const result = registerPayloadValidation.safeParse(validPayload);
        expect(result.success).toBe(true);
      });

      it("deve rejeitar senha sem letra maiúscula", () => {
        const result = registerPayloadValidation.safeParse({
          ...validPayload,
          password: "senha@123",
          confirm_password: "senha@123"
        });
        expect(result.success).toBe(false);
      });

      it("deve rejeitar senha sem letra minúscula", () => {
        const result = registerPayloadValidation.safeParse({
          ...validPayload,
          password: "SENHA@123",
          confirm_password: "SENHA@123"
        });
        expect(result.success).toBe(false);
      });

      it("deve rejeitar senha sem número", () => {
        const result = registerPayloadValidation.safeParse({
          ...validPayload,
          password: "Senha@abc",
          confirm_password: "Senha@abc"
        });
        expect(result.success).toBe(false);
      });

      it("deve rejeitar quando senhas não coincidem", () => {
        const result = registerPayloadValidation.safeParse({
          ...validPayload,
          confirm_password: "SenhaDiferente@123"
        });
        expect(result.success).toBe(false);
      });
    });

    describe("Validação de data de nascimento", () => {
      it("deve aceitar usuário maior de 13 anos", () => {
        const result = registerPayloadValidation.safeParse(validPayload);
        expect(result.success).toBe(true);
      });

      it("deve rejeitar usuário menor de 13 anos", () => {
        const result = registerPayloadValidation.safeParse({
          ...validPayload,
          birth_date: new Date()
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe("loginPayloadValidation", () => {
    const validPayload = {
      email: "joao@test.com",
      password: "Senha@123"
    };

    it("deve aceitar payload válido", () => {
      const result = loginPayloadValidation.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it("deve rejeitar email inválido", () => {
      const result = loginPayloadValidation.safeParse({
        ...validPayload,
        email: "email-invalido"
      });
      expect(result.success).toBe(false);
    });

    it("deve rejeitar senha vazia", () => {
      const result = loginPayloadValidation.safeParse({
        ...validPayload,
        password: ""
      });
      expect(result.success).toBe(false);
    });
  });
});
