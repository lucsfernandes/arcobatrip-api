import { DeleteAvatarUseCase } from "../../../../application/usecases/users/deleteAvatar/DeleteAvatarUseCase";
import { UploadAvatarUseCase } from "../../../../application/usecases/users/uploadAvatar/UploadAvatarUseCase";
import { MockUserRepo } from "../../../mocks/mockUserRepo";
import { MockStorageService } from "../../../mocks/mockStorageService";

describe("DeleteAvatarUseCase", () => {
  let userRepo: MockUserRepo;
  let storage: MockStorageService;
  let deleteAvatar: DeleteAvatarUseCase;
  let uploadAvatar: UploadAvatarUseCase;
  let userId: string;

  beforeEach(async () => {
    userRepo = new MockUserRepo();
    storage = new MockStorageService();
    deleteAvatar = new DeleteAvatarUseCase(userRepo, storage);
    uploadAvatar = new UploadAvatarUseCase(userRepo, storage);

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

  it("deletes the stored asset and clears the columns", async () => {
    await uploadAvatar.execute({ userId, fileBuffer: Buffer.from("img") });

    const result = await deleteAvatar.execute({ userId });

    expect(result.isSuccess).toBe(true);
    expect(storage.deleted).toEqual(["zarpa/avatars/asset-1"]);

    const user = await userRepo.findById(userId);
    expect(user!.avatarUrl).toBeNull();
    expect(user!.avatarPublicId).toBeNull();
  });

  it("is a no-op on storage when there is no avatar", async () => {
    const result = await deleteAvatar.execute({ userId });

    expect(result.isSuccess).toBe(true);
    expect(storage.deleted).toHaveLength(0);
  });

  it("returns 404 when the user does not exist", async () => {
    const result = await deleteAvatar.execute({ userId: "ghost" });

    expect(result.isFailure).toBe(true);
    expect(result.errorValue().statusCode).toBe(404);
  });
});
