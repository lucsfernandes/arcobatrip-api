import { DataSource, Repository } from "typeorm";
import { ParticipantRepo } from "../../../infra/repositories/ParticipantRepo";
import { Participant } from "../../../domain/entities/Participant/participant.entity";
import {
  CreateParticipantPayload,
  UpdateParticipantPayload,
} from "../../../application/usecases/participants/IParticipantRepo";

/**
 * Testes unitários dos métodos corrigidos do {@link ParticipantRepo}.
 *
 * O repositório real depende de um {@link DataSource} do TypeORM; aqui ele é
 * substituído por um mock que expõe apenas os métodos consumidos pelo
 * repositório (`create`, `save`, `findOne`, `update`), permitindo verificar o
 * fluxo de persistência sem um banco Postgres.
 */
describe("ParticipantRepo (unit)", () => {
  let repositoryMock: jest.Mocked<Pick<Repository<Participant>, "create" | "save" | "findOne" | "update">>;
  let participantRepo: ParticipantRepo;

  const buildEntity = (overrides: Partial<Participant> = {}): Participant =>
    ({
      id: "participant-1",
      name: "Ana Souza",
      email: "ana.souza@email.com",
      isConfirmed: false,
      isOwner: true,
      tripId: "trip-1",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      ...overrides,
    } as Participant);

  beforeEach(() => {
    repositoryMock = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };

    const dataSourceMock = {
      getRepository: jest.fn().mockReturnValue(repositoryMock),
    } as unknown as DataSource;

    participantRepo = new ParticipantRepo(dataSourceMock);
  });

  describe("create", () => {
    const payload: CreateParticipantPayload = {
      name: "Ana Souza",
      email: "ana.souza@email.com",
      isConfirmed: false,
      isOwner: true,
      tripId: "trip-1",
    };

    it("persiste a entidade com save e retorna o participante mapeado", async () => {
      const instance = buildEntity();
      const saved = buildEntity();

      repositoryMock.create.mockReturnValue(instance);
      repositoryMock.save.mockResolvedValue(saved);

      const result = await participantRepo.create(payload);

      expect(repositoryMock.create).toHaveBeenCalledWith(payload);
      expect(repositoryMock.save).toHaveBeenCalledWith(instance);
      expect(result).not.toBeNull();
      expect(result?.id).toBe("participant-1");
      expect(result?.email).toBe("ana.souza@email.com");
      expect(result?.tripId).toBe("trip-1");
    });

    it("retorna null quando save não devolve entidade", async () => {
      const instance = buildEntity();
      repositoryMock.create.mockReturnValue(instance);
      repositoryMock.save.mockResolvedValue(null as unknown as Participant);

      const result = await participantRepo.create(payload);

      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    const payload: UpdateParticipantPayload = {
      name: "Ana Paula",
      email: "ana.paula@email.com",
      isConfirmed: true,
      isOwner: true,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    };

    it("rebusca a entidade após o update e retorna o participante atualizado", async () => {
      const existing = buildEntity();
      const refreshed = buildEntity({ name: "Ana Paula", email: "ana.paula@email.com", isConfirmed: true });

      repositoryMock.findOne.mockResolvedValueOnce(existing).mockResolvedValueOnce(refreshed);
      repositoryMock.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });

      const result = await participantRepo.update("participant-1", payload);

      expect(repositoryMock.update).toHaveBeenCalledWith("participant-1", payload);
      expect(repositoryMock.findOne).toHaveBeenLastCalledWith({ where: { id: "participant-1" } });
      expect(result).not.toBeNull();
      expect(result?.name).toBe("Ana Paula");
      expect(result?.email).toBe("ana.paula@email.com");
      expect(result?.isConfirmed).toBe(true);
    });

    it("retorna null quando a entidade não existe", async () => {
      repositoryMock.findOne.mockResolvedValue(null);

      const result = await participantRepo.update("missing", payload);

      expect(result).toBeNull();
      expect(repositoryMock.update).not.toHaveBeenCalled();
    });
  });
});
