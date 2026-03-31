import { Body, Button, Container, Head, Heading, Html, Img, Preview, Section, Tailwind, Text } from '@react-email/components';

interface WelcomeEmailProps {
    username?: string;
    company?: string;
}

const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : '';

const WelcomeEmail = ({
    username = 'Nicole',
    company = 'Chaos',
}: WelcomeEmailProps) => {
    const previewText = `Welcome to ${company}, ${username}!`;

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Tailwind>
                <Body className="bg-black m-auto font-sans">
                    <Container className="mb-10 mx-auto p-5 max-w-[465px]">
                        <Section className="mt-10">
                            <Img
                                src={`${baseUrl}/static/chaos.png`}
                                width="150"
                                height="100"
                                alt="Logo Example"
                                className="my-0 mx-auto"
                            />
                        </Section>
                        <Heading className="text-2xl text-white font-normal text-center p-0 my-8 mx-0">
                            Welcome to <strong>{company}</strong>, {username}!
                        </Heading>
                        <Text className="text-start text-sm text-white">
                            Hello {username},
                        </Text>
                        <Text className="text-start text-sm text-white leading-relaxed">
                            We're excited to have you onboard at <strong>{company}</strong>.
                            We hope you enjoy your journey with us. If you have any questions
                            or need assistance, feel free to reach out.
                        </Text>
                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Button
                                className="py-2.5 px-5 bg-white rounded-md text-black text-sm font-semibold no-underline text-center"
                                href={`https://example.com/get-started`}
                            >
                                Get Started
                            </Button>
                        </Section>
                        <Text className="text-start text-sm text-white">
                            Cheers,
                            <br />
                            The {company} Team
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default WelcomeEmail;