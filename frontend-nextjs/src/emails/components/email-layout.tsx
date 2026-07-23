import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

const main = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "40px auto",
  padding: "40px 32px",
  maxWidth: "560px",
  borderRadius: "8px",
};

const footer = {
  color: "#71717a",
  fontSize: "12px",
  lineHeight: "18px",
  marginTop: "32px",
};

interface EmailLayoutProps {
  preview: string;
  organisationName: string;
  children: ReactNode;
}

export function EmailLayout({
  preview,
  organisationName,
  children,
}: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section>{children}</Section>
          <Text style={footer}>
            Sent via Chaos on behalf of {organisationName}.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
