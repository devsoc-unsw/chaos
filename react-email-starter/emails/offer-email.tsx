import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

export interface ChaosOfferEmailProps {
  // These match the keys your app already uses for template variables
  name?: string;
  role?: string;
  organisation_name?: string;
  campaign_name?: string;
  expiry_date?: string;

  // These are expected to be already resolved/merged by your service
  subject?: string;
  body?: string;

  // Asset hosting: recipients must be able to fetch this URL
  logoUrl?: string;
}

function renderMultilineText(text?: string) {
  const lines = (text ?? "").split(/\r?\n/);
  return lines.map((line, idx) => (
    <span key={idx}>
      {line}
      {idx < lines.length - 1 ? <br /> : null}
    </span>
  ));
}

export default function OfferEmail({
  name,
  role,
  organisation_name,
  campaign_name,
  expiry_date,
  body,
  logoUrl,
}: ChaosOfferEmailProps) {
  const resolvedAssetBaseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : '';

  const resolvedLogoUrl =
    logoUrl ?? `${resolvedAssetBaseUrl}/static/chaos.png`;

  const previewText = `Offer for ${campaign_name ?? ""}`.trim();

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-black m-auto font-sans">
          <Container className="mb-10 mx-auto p-5 max-w-[465px]">
            <Section className="mt-10">
              <Img
                src={resolvedLogoUrl}
                width="150"
                height="100"
                alt="Chaos logo"
                className="my-0 mx-auto"
              />
            </Section>

            <Heading className="text-2xl text-white font-normal text-center p-0 my-8 mx-0">
              Offer{campaign_name ? `: ${campaign_name}` : ""}
            </Heading>

            <Text className="text-[14px] text-white leading-[24px] whitespace-pre-wrap">
              Hello {name ?? ""}
              {role ? `, your role is ${role}.` : "."}
            </Text>

            {organisation_name ? (
              <Text className="text-[14px] text-white leading-[24px]">
                From <strong>{organisation_name}</strong>.
              </Text>
            ) : null}

            {expiry_date ? (
              <Text className="text-[14px] text-white leading-[24px]">
                Please reply by <strong>{expiry_date}</strong>.
              </Text>
            ) : null}

            <Section className="text-center mt-[24px]">
              <Text className="text-[14px] text-white leading-[24px]">
                {renderMultilineText(body)}
              </Text>
            </Section>

            <Section className="mt-[32px]">
              <Text className="text-[12px] text-white leading-[24px] opacity-80">
                If you have any questions, please reply to this email.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

OfferEmail.PreviewProps = {
  name: "Nicole",
  role: "Marketing Director",
  organisation_name: "DevSoc",
  campaign_name: "DevSoc Executive Recruitment 2024",
  expiry_date: "30/03/2026 17:00",
  subject: "Offer",
  body:
    "We’re excited to have you onboard.\n\nPlease confirm your acceptance by the expiry date above.",
  assetBaseUrl: "https://example.com",
} as ChaosOfferEmailProps;

