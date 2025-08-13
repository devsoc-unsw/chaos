import { useEffect, useMemo, useState, useContext } from "react";
import { Link, useParams } from "react-router-dom";
import tw from "twin.macro";

import { getCampaignByOrgAndCampaignSlugs, getOrganisationBySlug, getCampaignRoles } from "api";
import Container from "components/Container";
import Card from "components/Card";
import { LoadingIndicator } from "components";
import { Button } from "components/ui/button";
import { Badge } from "components/ui/badge";
import { Calendar, Users, Clock, MapPin } from "lucide-react";
import { SetNavBarTitleContext } from "contexts/SetNavbarTitleContext";

import type { Campaign, Organisation, Role } from "types/api";

const Section = tw.div`flex flex-col gap-3`;
// const SideCard = tw(Card)`sticky top-20`;
const Hero = tw.div`relative w-full h-64 md:h-80 rounded-xl overflow-hidden mb-8`;
const Banner = tw.img`w-full h-full object-cover`;
const HeroOverlay = tw.div`absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end`;
const HeroText = tw.div`p-6 text-white`;

const CampaignLandingPage = () => {
  const { organisationSlug = "", campaignSlug = "" } = useParams();
  const [campaign, setCampaign] = useState<Campaign>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [organisation, setOrganisation] = useState<Organisation | undefined>();
  const [roles, setRoles] = useState<Role[]>([]);
  const setNavBarTitle = useContext(SetNavBarTitleContext);

  useEffect(() => {
    setNavBarTitle("");
  }, []);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(undefined);
    (async () => {
      try {
        const c = await getCampaignByOrgAndCampaignSlugs(
          organisationSlug,
          campaignSlug
        );
        if (!isMounted) return;
        setCampaign(c);
        setNavBarTitle(c.name);

        // Fire off parallel requests not strictly needed for page render
        const [org, rs] = await Promise.all([
          getOrganisationBySlug(organisationSlug).catch(() => undefined),
          getCampaignRoles(c.id).catch(() => [] as Role[]),
        ]);
        if (!isMounted) return;
        setOrganisation(org);
        setRoles(rs);
      } catch (e) {
        if (!isMounted) return;
        setError("Failed to load campaign");
        console.error(e);
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [organisationSlug, campaignSlug]);

  const statusBadge = useMemo(() => {
    if (!campaign) return null;
    const now = new Date();
    const end = new Date(campaign.ends_at);
    const isOpen = now <= end;
    return (
      <Badge className={`${isOpen ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-500 hover:bg-gray-600"}`}>
        {isOpen ? "OPEN" : "CLOSED"}
      </Badge>
    );
  }, [campaign]);

  if (loading) {
    return (
      <div tw="grid min-h-[60vh] place-items-center">
        <LoadingIndicator />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <Container>
        <Card>
          <p tw="text-red-600">{error ?? "Campaign not found."}</p>
          <Link to="/dashboard" tw="mt-2 text-blue-600 underline">
            Back to dashboard
          </Link>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      {/* Hero Banner */}
      <Hero>
        <Banner src={campaign.cover_image || "/placeholder.svg"} alt={`${campaign.name} banner`} />
        <HeroOverlay>
          <HeroText>
            <div tw="mb-4">{statusBadge}</div>
            <h1 tw="text-3xl md:text-4xl font-bold mb-2">{campaign.name}</h1>
            <p tw="text-lg opacity-90">{campaign.organisation_name}</p>
          </HeroText>
        </HeroOverlay>
      </Hero>

      {/* Content Grid */}
      <div tw="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div tw="space-y-6 lg:col-span-2">
          {/* About */}
          <Card>
            <div tw="mb-6 flex items-center gap-4">
              <img
                tw="h-16 w-16 rounded-lg object-cover"
                src={organisation?.logo || "/placeholder.svg"}
                alt={`${campaign.organisation_name} logo`}
              />
              <div>
                <h2 tw="text-2xl font-bold">{campaign.organisation_name}</h2>
                <p tw="text-gray-600">{campaign.description}</p>
              </div>
            </div>

            {/* Long description not provided by API; reuse description for now */}
            <div tw="text-gray-800 leading-relaxed">
              <p>{campaign.description}</p>
            </div>
          </Card>

          {/* Roles */}
          <Card>
            <Section>
              <h2 tw="text-2xl font-bold">Available Roles</h2>
              {roles.length === 0 ? (
                <p tw="text-gray-600">Roles listing will appear here.</p>
              ) : (
                <div tw="space-y-6">
                  {roles.map((r) => (
                    <div key={r.id} tw="border-b pb-6 last:border-b-0 last:pb-0">
                      <h3 tw="mb-2 text-xl font-semibold">{r.name}</h3>
                      {r.description && (
                        <p tw="mb-2 text-gray-700">{r.description}</p>
                      )}
                      <p tw="text-gray-600">
                        Positions available: {r.min_available} - {r.max_available}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </Card>
        </div>

        <div tw="space-y-6">
          {/* Application CTA */}
          <Card>
            <h3 tw="mb-4 text-xl font-bold">Apply Now</h3>
            <div tw="mb-6 space-y-4">
              <div tw="flex items-center gap-3 text-gray-700">
                <Calendar tw="h-5 w-5 text-gray-500" />
                <div>
                  <p tw="font-medium">Application Deadline</p>
                  <p>{new Date(campaign.ends_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div tw="flex items-center gap-3 text-gray-700">
                <Users tw="h-5 w-5 text-gray-500" />
                <div>
                  <p tw="font-medium">Current Applicants</p>
                  <p>—</p>
                </div>
              </div>
            </div>
            <Button asChild className="w-full bg-purple-600 hover:bg-purple-700">
              <Link to={`/apply/${campaign.id}`}>
                Apply for this Campaign
              </Link>
            </Button>
          </Card>

          {/* Timeline - placeholder content */}
          <Card>
            <h3 tw="mb-4 text-xl font-bold">Recruitment Timeline</h3>
            <ol tw="relative ml-3 space-y-6 border-l border-gray-200">
              {[
                { label: "Applications Open", date: new Date(campaign.starts_at).toLocaleDateString() },
                { label: "Applications Close", date: new Date(campaign.ends_at).toLocaleDateString() },
              ].map((item) => (
                <li key={item.label} tw="ml-6">
                  <span tw="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 ring-8 ring-white">
                    <Clock tw="h-3 w-3 text-purple-600" />
                  </span>
                  <h4 tw="font-semibold text-gray-900">{item.label}</h4>
                  <p tw="text-sm text-gray-600">{item.date}</p>
                </li>
              ))}
            </ol>
          </Card>

          {/* Contact Info - placeholder */}
          <Card>
            <h3 tw="mb-4 text-xl font-bold">Contact Information</h3>
            <div tw="space-y-4">
              <div tw="flex items-center gap-3 text-gray-700">
                <MapPin tw="h-5 w-5 text-gray-500" />
                <p>UNSW Sydney, Kensington Campus</p>
              </div>
              <div tw="flex items-center gap-3 text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" tw="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href={`mailto:recruitment@${campaign.organisation_slug}.com`} tw="text-blue-600 hover:underline">
                  recruitment@{campaign.organisation_slug}.com
                </a>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Container>
  );
};

export default CampaignLandingPage;
