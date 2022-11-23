import { Tab } from "@headlessui/react";
import {
  CheckIcon,
  EyeIcon,
  PaperAirplaneIcon,
  PencilIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { Container } from "@mui/material";
import { Fragment, useCallback, useContext, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import tw, { styled } from "twin.macro";

import { LoadingIndicator, ReviewerStepper } from "components";
import Button from "components/Button";
import Tabs from "components/Tabs";
import Textarea from "components/Textarea";
import { SetNavBarTitleContext } from "contexts/SetNavbarTitleContext";
import useFetch from "hooks/useFetch";

import { useRoles } from "..";

import emailTemplates from "./email_templates";

import type { ChangeEvent, ReactNode } from "react";
import type {
  ApplicationStatus,
  Campaign,
  Organisation,
  RoleApplications,
} from "types/api";

const Icon = styled.span(tw`inline w-4 h-4`);
const tabIcons: { [status in ApplicationStatus]?: ReactNode } = {
  Success: <Icon as={CheckIcon} tw="text-green-600" />,
  Rejected: <Icon as={XMarkIcon} tw="text-red-600" />,
};

const FinaliseCandidates = () => {
  const campaignId = Number(useParams().campaignId);
  const setNavBarTitle = useContext(SetNavBarTitleContext);
  const roleId = Number(useParams().roleId);
  const roles = useRoles();
  const [organisation, setOrganisation] = useState("ORGANISATION");

  const [emails, setEmails] = useState<{ [id: number]: string }>({});

  const { get: getOrg, loading: orgLoading } = useFetch<Organisation>(
    `/organisation`,
    {
      errorSummary: "Error getting organisation",
      onSuccess: ({ name }) => setOrganisation(name),
    }
  );

  useFetch<Campaign>(`/campaign/${campaignId}`, {
    deps: [],
    errorSummary: "Error getting campaign",
    onSuccess: ({ name, organisation_id: orgId }) => {
      setNavBarTitle(name);
      void getOrg(`/${orgId}`);
    },
  });

  const { data, loading } = useFetch<RoleApplications>(
    `/role/${roleId}/applications`,
    {
      deps: [],
      errorSummary: "Error getting applications",
      onSuccess: ({ applications }) => {
        const newEmails = Object.fromEntries(
          applications
            .filter(({ id }) => !(id in emails))
            .map(({ id, private_status: status }) => [
              id,
              emailTemplates[status] ?? "",
            ])
        );
        setEmails({ ...emails, ...newEmails });
      },
    }
  );

  const applications = data?.applications ?? [];
  const tabs = useMemo(
    () =>
      applications.map((a) => ({
        id: a.id,
        name: a.user_display_name,
        contents: (
          <div tw="flex gap-2">
            <span tw="">{a.user_display_name}</span>
            <span tw="ml-auto self-end">{tabIcons[a.private_status]}</span>
          </div>
        ),
        status: a.private_status,
      })),
    [data]
  );
  const [selectedTab, setSelectedTab] = useState(0);
  const [preview, setPreview] = useState(false);

  const params = useMemo(
    () => ({
      role: roles[roleId]?.name,
      organisation,
    }),
    [roles, organisation]
  );

  const renderEmail = useCallback(
    (id: number, name: string) => {
      const emailParams = { name, ...params };
      return emails[id].replaceAll(
        new RegExp(
          Object.keys(emailParams)
            .map((p) => `{${p}}`)
            .join("|"),
          "g"
        ),
        (p) =>
          emailParams[p.substring(1, p.length - 1) as keyof typeof emailParams]
      );
    },
    [emails, params]
  );

  const useForAll = useCallback(() => {
    const tab = tabs[selectedTab];
    const newEmails = Object.fromEntries(
      tabs
        .filter(({ status }) => status === tab.status)
        .map(({ id }) => [id, emails[tab.id]])
    );
    setEmails({
      ...emails,
      ...newEmails,
    });
  }, [selectedTab, tabs, emails]);

  if (loading || orgLoading) {
    return <LoadingIndicator />;
  }

  return (
    <Container tw="max-h-[calc(100vh - 4rem)] flex! flex-col">
      <ReviewerStepper activeStep={2} />

      <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab} vertical>
        <div tw="flex overflow-hidden">
          <Tabs
            tw="p-1 min-w-36 max-w-48 overflow-y-auto"
            tabs={tabs}
            vertical
          />
          <Tab.Panels tw="flex-1 p-1">
            {tabs.map(({ id, name }) => (
              <Tab.Panel key={id} as={Fragment}>
                {preview ? (
                  <Textarea.Wrapper
                    as="div"
                    size="lg"
                    tw="shadow overflow-y-auto whitespace-pre-wrap"
                  >
                    <Textarea.Header>
                      <EyeIcon tw="w-4 h-4" /> Preview
                    </Textarea.Header>
                    <div tw="px-3 py-2">{renderEmail(id, name)}</div>
                  </Textarea.Wrapper>
                ) : (
                  <Textarea
                    size="lg"
                    tw="shadow overflow-y-auto"
                    value={emails[id]}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                      setEmails({ ...emails, [id]: e.target.value })
                    }
                  />
                )}
              </Tab.Panel>
            ))}
            <div tw="ml-auto mt-4 flex">
              <div>
                <Button color="white" onClick={useForAll}>
                  Use for all {tabs[selectedTab].status.toLowerCase()}
                </Button>
              </div>
              <div tw="ml-auto flex gap-2">
                <Button color="white" onClick={() => setPreview(!preview)}>
                  {preview ? (
                    <>
                      <Icon as={PencilIcon} /> Edit
                    </>
                  ) : (
                    <>
                      <Icon as={EyeIcon} /> Preview
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    /* TODO: send the email to the backend */
                  }}
                >
                  Send <Icon as={PaperAirplaneIcon} />
                </Button>
                <Button
                  onClick={() => {
                    /* TODO: send the email to the backend */
                  }}
                >
                  Send All <Icon as={PaperAirplaneIcon} />
                </Button>
              </div>
            </div>
          </Tab.Panels>
        </div>
      </Tab.Group>
    </Container>
  );
};

export default FinaliseCandidates;
