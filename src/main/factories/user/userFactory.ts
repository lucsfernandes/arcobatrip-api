import { userRepo, verificationTokenRepo } from "../typeOrmRepoFactory";
import { emailService } from "../../../infra/services/email/ResendEmailService";
import { storageService } from "../../../infra/services/storage/CloudinaryStorageService";
import { PhoneVerificationEmitter } from "../../../application/services/PhoneVerificationEmitter";

import { UpdateProfileUseCase } from "../../../application/usecases/users/updateProfile/UpdateProfileUseCase";
import { UploadAvatarUseCase } from "../../../application/usecases/users/uploadAvatar/UploadAvatarUseCase";
import { DeleteAvatarUseCase } from "../../../application/usecases/users/deleteAvatar/DeleteAvatarUseCase";
import { RequestPhoneVerificationUseCase } from "../../../application/usecases/users/requestPhoneVerification/RequestPhoneVerificationUseCase";
import { VerifyPhoneUseCase } from "../../../application/usecases/users/verifyPhone/VerifyPhoneUseCase";

import { GetProfileController } from "../../../presentation/controllers/User/GetProfileController";
import { UpdateProfileController } from "../../../presentation/controllers/User/UpdateProfileController";
import { UploadAvatarController } from "../../../presentation/controllers/User/UploadAvatarController";
import { DeleteAvatarController } from "../../../presentation/controllers/User/DeleteAvatarController";
import { RequestPhoneVerificationController } from "../../../presentation/controllers/User/RequestPhoneVerificationController";
import { VerifyPhoneController } from "../../../presentation/controllers/User/VerifyPhoneController";

const phoneVerificationEmitter = new PhoneVerificationEmitter(
  emailService,
  verificationTokenRepo
);

// Use cases
const updateProfileUseCase = new UpdateProfileUseCase(userRepo, phoneVerificationEmitter);
const uploadAvatarUseCase = new UploadAvatarUseCase(userRepo, storageService);
const deleteAvatarUseCase = new DeleteAvatarUseCase(userRepo, storageService);
const requestPhoneVerificationUseCase = new RequestPhoneVerificationUseCase(
  userRepo,
  phoneVerificationEmitter
);
const verifyPhoneUseCase = new VerifyPhoneUseCase(userRepo, verificationTokenRepo);

// Controllers
const getProfileController = new GetProfileController(userRepo);
const updateProfileController = new UpdateProfileController(updateProfileUseCase);
const uploadAvatarController = new UploadAvatarController(uploadAvatarUseCase);
const deleteAvatarController = new DeleteAvatarController(deleteAvatarUseCase);
const requestPhoneVerificationController = new RequestPhoneVerificationController(
  requestPhoneVerificationUseCase
);
const verifyPhoneController = new VerifyPhoneController(verifyPhoneUseCase);

export {
  getProfileController,
  updateProfileController,
  uploadAvatarController,
  deleteAvatarController,
  requestPhoneVerificationController,
  verifyPhoneController,
};
