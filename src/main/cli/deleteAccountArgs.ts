export interface DeleteAccountArgs {
  email: string;
  /** Without `--confirm` the command only reports what it would do. */
  confirm: boolean;
  retryImages: boolean;
}

/** Parses `--email <e-mail> [--confirm] [--retry-images]`; throws a readable message on bad input. */
export function parseDeleteAccountArgs(argv: string[]): DeleteAccountArgs {
  let email = "";
  let confirm = false;
  let retryImages = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--confirm") confirm = true;
    else if (arg === "--retry-images") retryImages = true;
    else if (arg === "--email") {
      email = (argv[i + 1] ?? "").trim();
      i += 1;
    } else if (arg.startsWith("--email=")) email = arg.slice("--email=".length).trim();
    else throw new Error(`Argumento desconhecido: ${arg}`);
  }

  if (!email || email.startsWith("--")) throw new Error("Informe o e-mail da conta com --email <e-mail>");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("O e-mail informado não parece válido");
  if (retryImages && confirm) {
    throw new Error("--retry-images e --confirm não se combinam: use um de cada vez");
  }
  return { email, confirm, retryImages };
}
