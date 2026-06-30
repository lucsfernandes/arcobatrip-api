import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface ResetPasswordEmailProps {
  name: string;
  resetUrl: string;
}

/** Recuperação de senha. */
export default function ResetPasswordEmail({
  name,
  resetUrl,
}: ResetPasswordEmailProps): React.ReactElement {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>Redefina sua senha do Arcobatrip</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section>
            <Heading style={brand}>Arcobatrip</Heading>
            <Heading style={heading}>Redefinição de senha</Heading>
            <Text style={paragraph}>Olá, {name}!</Text>
            <Text style={paragraph}>
              Recebemos um pedido para redefinir a senha da sua conta. Clique no botão
              abaixo para criar uma nova senha.
            </Text>
            <Button style={button} href={resetUrl}>
              Redefinir senha
            </Button>
            <Text style={paragraph}>
              Se o botão não funcionar, copie e cole este link no seu navegador:
            </Text>
            <Link href={resetUrl} style={link}>
              {resetUrl}
            </Link>
            <Text style={footer}>
              Se você não solicitou a redefinição, ignore este email — sua senha
              permanecerá a mesma.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main: React.CSSProperties = {
  backgroundColor: "#f4f4f7",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "32px",
  maxWidth: "560px",
  borderRadius: "12px",
};

const brand: React.CSSProperties = {
  color: "#12fda4",
  fontSize: "20px",
  fontWeight: 700,
  margin: "0 0 24px"
};

const heading: React.CSSProperties = {
  color: "#18181b",
  fontSize: "24px",
  fontWeight: 700,
  margin: "0 0 16px",
};

const paragraph: React.CSSProperties = {
  color: "#3f3f46",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const button: React.CSSProperties = {
  backgroundColor: "#12fda4",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: 600,
  textDecoration: "none",
  textAlign: "center",
  display: "inline-block",
  padding: "12px 24px",
  margin: "8px 0 24px"
};

const link: React.CSSProperties = {
  color: "#12fda4",
  fontSize: "14px",
  wordBreak: "break-all"
};

const footer: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: "13px",
  margin: "24px 0 0",
};
