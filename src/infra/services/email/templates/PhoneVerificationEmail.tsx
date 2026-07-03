import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface PhoneVerificationEmailProps {
  name: string;
  code: string;
  ttlMinutes: number;
}

/** Código de 6 dígitos para confirmar o celular do usuário (enviado por email). */
export default function PhoneVerificationEmail({
  name,
  code,
  ttlMinutes,
}: PhoneVerificationEmailProps): React.ReactElement {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>Seu código de verificação de celular no Zarpa</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section>
            <Heading style={brand}>Zarpa</Heading>
            <Heading style={heading}>Confirme seu celular</Heading>
            <Text style={paragraph}>Olá, {name}!</Text>
            <Text style={paragraph}>
              Use o código abaixo para confirmar seu número de celular:
            </Text>
            <Text style={codeStyle}>{code}</Text>
            <Text style={paragraph}>
              O código expira em {ttlMinutes} minutos. Se você não solicitou esta
              verificação, ignore este email.
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

const codeStyle: React.CSSProperties = {
  color: "#18181b",
  fontSize: "36px",
  fontWeight: 700,
  letterSpacing: "10px",
  textAlign: "center",
  margin: "8px 0 24px",
};
