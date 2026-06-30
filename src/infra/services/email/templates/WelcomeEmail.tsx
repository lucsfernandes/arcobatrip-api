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

export interface WelcomeEmailProps {
  name: string;
}

/** Boas-vindas enviado logo após o cadastro. */
export default function WelcomeEmail({ name }: WelcomeEmailProps): React.ReactElement {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>Bem-vindo(a) ao Arcobatrip!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section>
            <Heading style={brand}>Arcobatrip</Heading>
            <Heading style={heading}>Bem-vindo(a), {name}!</Heading>
            <Text style={paragraph}>
              Sua conta foi criada com sucesso. Agora você pode planejar suas viagens,
              convidar amigos e organizar tudo em um só lugar.
            </Text>
            <Text style={paragraph}>
              Boa viagem! ✈️
            </Text>
            <Text style={footer}>
              Equipe Arcobatrip
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

const footer: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: "13px",
  margin: "24px 0 0",
};
