import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface NotificationEmailProps {
  name: string;
  title: string;
  body: string;
  actionUrl?: string;
}

/** Espelha uma notificação in-app por email. */
export default function NotificationEmail({
  name,
  title,
  body,
  actionUrl,
}: NotificationEmailProps): React.ReactElement {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>{title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section>
            <Heading style={brand}>Arcobatrip</Heading>
            <Heading style={heading}>{title}</Heading>
            <Text style={paragraph}>Olá, {name}!</Text>
            <Text style={paragraph}>{body}</Text>
            {actionUrl ? (
              <Button style={button} href={actionUrl}>
                Ver detalhes
              </Button>
            ) : null}
            <Text style={footer}>
              Você está recebendo este email porque tem uma conta no Arcobatrip.
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
  fontSize: "22px",
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

const footer: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: "13px",
  margin: "24px 0 0",
};
