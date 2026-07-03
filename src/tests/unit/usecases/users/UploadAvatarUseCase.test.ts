import { UploadAvatarUseCase } from "../../../../application/usecases/users/uploadAvatar/UploadAvatarUseCase";
import { MockUserRepo } from "../../../mocks/mockUserRepo";
import { MockStorageService } from "../../../mocks/mockStorageService";

describe("UploadAvatarUseCase", () => {
  let userRepo: MockUserRepo;
  let storage: MockStorageService;
  let useCase: UploadAvatarUseCase;
  let userId: string;

  beforeEach(async () => {
    userRepo = new MockUserRepo();
    storage = new MockStorageService();
    useCase = new UploadAvatarUseCase(userRepo, storage);

    const created = await userRepo.create({
      fullName: "Ana",
      email: "ana@email.com",
      password: "hashed",
    });
    userId = created!.id;
  });

  afterEach(() => {
    userRepo.clear();
    storage.clear();
  });

  it("uploads the image and persists url + public_id", async () => {
    const result = await useCase.execute({
      userId,
      fileBuffer: Buffer.from("img"),
    });

    expect(result.isSuccess).toBe(true);
    expect(storage.uploads).toHaveLength(1);
    expect(storage.uploads[0].folder).toBe("zarpa/avatars");
    expect(result.getValue().avatarUrl).toMatch(/^https:\/\/cdn\.test\//);
    expect(storage.deleted).toHaveLength(0);
  });

  it("deletes the previous avatar when replacing", async () => {
    await useCase.execute({ userId, fileBuffer: Buffer.from("first") });
    const result = await useCase.execute({ userId, fileBuffer: Buffer.from("second") });

    expect(result.isSuccess).toBe(true);
    expect(storage.uploads).toHaveLength(2);
    // The first asset's public_id was deleted on replace.
    expect(storage.deleted).toEqual(["zarpa/avatars/asset-1"]);
  });

  it("returns 404 when the user does not exist", async () => {
    const result = await useCase.execute({
      userId: "ghost",
      fileBuffer: Buffer.from("img"),
    });

    expect(result.isFailure).toBe(true);
    expect(result.errorValue().statusCode).toBe(404);
    expect(storage.uploads).toHaveLength(0);
  });

  it("surfaces an internal error when the upload fails", async () => {
    storage.failUpload = true;

    const result = await useCase.execute({
      userId,
      fileBuffer: Buffer.from("img"),
    });

    expect(result.isFailure).toBe(true);
    expect(result.errorValue().statusCode).toBe(500);
  });
});
