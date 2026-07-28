import { Heading, Text } from "@react-email/components";
import { EmailLayout } from "./components/email-layout";
import type { EmailTemplateVars } from "./types";

const heading = {
  color: "#18181b",
  fontSize: "24px",
  fontWeight: "600" as const,
  lineHeight: "32px",
  margin: "0 0 16px",
};

const paragraph = {
  color: "#3f3f46",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const highlight = {
  color: "#18181b",
  fontWeight: "600" as const,
};

/** Hardcoded acceptance / offer email for demo purposes. */
export function AcceptanceEmail({
  name,
  organisation_name
}: EmailTemplateVars) {
  const preview = `Thank you for testing out CHAOS!`;

  return (
    <EmailLayout preview={preview} organisationName={organisation_name}>
      <Heading style={heading}>Thank you, {name}!</Heading>
      <Text style={paragraph}>
        Thank you so much for testing out CHAOS. We hope it was an enjoyable experience, and
        appreciate your feedback and insight.
      </Text>
      <Text style={paragraph}>
        We hope you have a great time enjoying the rest of Starlight, and look forward to seeing you again soon!
      </Text>
      <Text style={paragraph}>
        Best regards,
        <br />
        CHAOS
      </Text>
    </EmailLayout>
  );
}
