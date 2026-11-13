import "reflect-metadata";
import AppDataSource from "../../infra/db/ormconfig";
import { UserRepo } from "../../infra/repositories/UserRepo";
import { AuditLogRepo } from "../../infra/repositories/AuditLogRepo";
import { AccountDeletionRepo } from "../../infra/repositories/AccountDeletionRepo";
import { storageService } from "../../infra/services/storage/CloudinaryStorageService";
import { AuditLog } from "../../application/services/AuditLog";
import { DeleteAccountUseCase } from "../../application/usecases/users/deleteAccount/DeleteAccountUseCase";
import { parseDeleteAccountArgs } from "./deleteAccountArgs";

const USAGE = `
Exclui a conta de um usuário e os dados dele (LGPD).

  Simulação (não altera nada):   npm run account:delete -- --email <e-mail>
  Excluir de verdade:            npm run account:delete -- --email <e-mail> --confirm
  Refazer a remoção de imagens:  npm run account:delete -- --email <e-mail> --retry-images

Dentro do contêiner de produção use "npm run account:delete:prod -- ...".
Sem --confirm o comando só mostra o que seria feito.
`;

async function main(): Promise<number> {
  let args;
  try {
    args = parseDeleteAccountArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`Erro: ${(error as Error).message}\n${USAGE}`);
    return 2;
  }

  await AppDataSource.initialize();
  const audit = new AuditLog(new AuditLogRepo(AppDataSource));
  const useCase = new DeleteAccountUseCase(
    new UserRepo(AppDataSource),
    new AccountDeletionRepo(AppDataSource),
    storageService,
    audit
  );

  if (args.retryImages) {
    const result = await useCase.retryPendingImages(args.email);
    if (result.isFailure) {
      console.error("Falha ao refazer a remoção das imagens.");
      return 1;
    }
    const { retried, remaining } = result.getValue();
    console.log(`Imagens removidas agora: ${retried}. Ainda pendentes: ${remaining.length}.`);
    return remaining.length === 0 ? 0 : 1;
  }

  const result = await useCase.execute({ email: args.email, dryRun: !args.confirm, actor: "system" });
  if (result.isFailure) {
    console.error(`Falha: ${String(result.errorValue().errors)}`);
    return 1;
  }

  const { status, counts, pendingImages } = result.getValue();
  if (status === "not_found") {
    console.log("Nenhuma conta com esse e-mail (já excluída, ou nunca existiu). Nada a fazer.");
    return 0;
  }
  console.log(status === "dry_run" ? "SIMULAÇÃO — nada foi alterado:" : "Conta excluída:");
  console.table(counts);
  if (status === "dry_run") console.log("Para excluir de verdade, repita o comando com --confirm.");
  if (pendingImages.length > 0) {
    console.warn(
      `${pendingImages.length} imagem(ns) não puderam ser removidas do Cloudinary. ` +
        "Elas ficaram registradas na auditoria; refaça com --retry-images."
    );
    return 1;
  }
  return 0;
}

main()
  .then((code) => AppDataSource.destroy().finally(() => process.exit(code)))
  .catch(async (error) => {
    console.error("Erro inesperado:", (error as Error).name);
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
    process.exit(1);
  });
