import {
  userRepo,
  verificationTokenRepo,
  accountDeletionRepo,
  auditLog,
} from "../typeOrmRepoFactory";
import { emailService } from "../../../infra/services/email/ResendEmailService";
import { storageService } from "../../../infra/services/storage/CloudinaryStorageService";
import { PhoneVerificationEmitter } from "../../../application/services/PhoneVerificationEmitter";
import { AccountEmailEmitter } from "../../../application/services/AccountEmailEmitter";

import { UpdateProfileUseCase } from "../../../application/usecases/users/updateProfile/UpdateProfileUseCase";
import { UploadAvatarUseCase } from "../../../application/usecases/users/uploadAvatar/UploadAvatarUseCase";
import { DeleteAvatarUseCase } from "../../../application/usecases/users/deleteAvatar/DeleteAvatarUseCase";
import { RequestPhoneVerificationUseCase } from "../../../application/usecases/users/requestPhoneVerification/RequestPhoneVerificationUseCase";
import { VerifyPhoneUseCase } from "../../../application/usecases/users/verifyPhone/VerifyPhoneUseCase";
import { DeleteAccountUseCase } from "../../../application/usecases/users/deleteAccount/DeleteAccountUseCase";
import { RequestAccountDeletionUseCase } from "../../../application/usecases/users/requestAccountDeletion/RequestAccountDeletionUseCase";
import { ConfirmAccountDeletionUseCase } from "../../../application/usecases/users/confirmAccountDeletion/ConfirmAccountDeletionUseCase";

import { GetProfileController } from "../../../presentation/controllers/User/GetProfileController";
import { UpdateProfileController } from "../../../presentation/controllers/User/UpdateProfileController";
import { UploadAvatarController } from "../../../presentation/controllers/User/UploadAvatarController";
import { DeleteAvatarController } from "../../../presentation/controllers/User/DeleteAvatarController";
import { RequestPhoneVerificationController } from "../../../presentation/controllers/User/RequestPhoneVerificationController";
import { VerifyPhoneController } from "../../../presentation/controllers/User/VerifyPhoneController";
import { RequestAccountDeletionController } from "../../../presentation/controllers/User/RequestAccountDeletionController";
import { ConfirmAccountDeletionController } from "../../../presentation/controllers/User/ConfirmAccountDeletionController";

const phoneVerificationEmitter = new PhoneVerificationEmitter(
  emailService,
  verificationTokenRepo
);

const accountEmailEmitter = new AccountEmailEmitter(emailService, verificationTokenRepo);

// Use cases
const updateProfileUseCase = new UpdateProfileUseCase(userRepo, phoneVerificationEmitter);
const uploadAvatarUseCase = new UploadAvatarUseCase(userRepo, storageService);
const deleteAvatarUseCase = new DeleteAvatarUseCase(userRepo, storageService);
const requestPhoneVerificationUseCase = new RequestPhoneVerificationUseCase(
  userRepo,
  phoneVerificationEmitter
);
const verifyPhoneUseCase = new VerifyPhoneUseCase(userRepo, verificationTokenRepo);
const deleteAccountUseCase = new DeleteAccountUseCase(
  userRepo,
  accountDeletionRepo,
  storageService,
  auditLog
);
const requestAccountDeletionUseCase = new RequestAccountDeletionUseCase(
  userRepo,
  accountEmailEmitter,
  auditLog
);
const confirmAccountDeletionUseCase = new ConfirmAccountDeletionUseCase(
  userRepo,
  verificationTokenRepo,
  deleteAccountUseCase,
  auditLog
);

// Controllers
const getProfileController = new GetProfileController(userRepo);
const updateProfileController = new UpdateProfileController(updateProfileUseCase);
const uploadAvatarController = new UploadAvatarController(uploadAvatarUseCase);
const deleteAvatarController = new DeleteAvatarController(deleteAvatarUseCase);
const requestPhoneVerificationController = new RequestPhoneVerificationController(
  requestPhoneVerificationUseCase
);
const verifyPhoneController = new VerifyPhoneController(verifyPhoneUseCase);
const requestAccountDeletionController = new RequestAccountDeletionController(
  requestAccountDeletionUseCase
);
const confirmAccountDeletionController = new ConfirmAccountDeletionController(
  confirmAccountDeletionUseCase
);

export {
  getProfileController,
  updateProfileController,
  uploadAvatarController,
  deleteAvatarController,
  requestPhoneVerificationController,
  verifyPhoneController,
  requestAccountDeletionController,
  confirmAccountDeletionController,
};
