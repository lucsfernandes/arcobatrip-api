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

export interface VerifyEmailProps {
  name: string;
  verifyUrl: string;
}

/** Confirmação de email enviada no cadastro (e no reenvio). */
export default function VerifyEmail({ name, verifyUrl }: VerifyEmailProps): React.ReactElement {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>Confirme seu endereço de email no Arcobatrip</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section>
            <Heading style={brand}>Arcobatrip</Heading>
            <Heading style={heading}>Confirme seu email</Heading>
            <Text style={paragraph}>Olá, {name}!</Text>
            <Text style={paragraph}>
              Para ativar sua conta, confirme seu endereço de email clicando no botão abaixo.
            </Text>
            <Button style={button} href={verifyUrl}>
              Confirmar email
            </Button>
            <Text style={paragraph}>
              Se o botão não funcionar, copie e cole este link no seu navegador:
            </Text>
            <Link href={verifyUrl} style={link}>
              {verifyUrl}
            </Link>
            <Text style={footer}>
              Se você não criou uma conta no Arcobatrip, ignore este email.
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
  color: "#7c3aed",
  fontSize: "20px",
  fontWeight: 700,
  margin: "0 0 24px",
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
  backgroundColor: "#7c3aed",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: 600,
  textDecoration: "none",
  textAlign: "center",
  display: "inline-block",
  padding: "12px 24px",
  margin: "8px 0 24px",
};

const link: React.CSSProperties = {
  color: "#7c3aed",
  fontSize: "14px",
  wordBreak: "break-all",
};

const footer: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: "13px",
  margin: "24px 0 0",
};
