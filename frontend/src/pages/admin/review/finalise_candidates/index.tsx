import { Tab } from "@headlessui/react";
import {
  CheckIcon,
  EyeIcon,
  PaperAirplaneIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { Container } from "@mui/material";
import {
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams } from "react-router-dom";
import tw, { styled } from "twin.macro";

import { LoadingIndicator, ReviewerStepper } from "components";
import Button from "components/Button";
import Tabs from "components/Tabs";
import Textarea from "components/Textarea";
import { MessagePopupContext } from "contexts/MessagePopupContext";
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

const Icon = styled.div(tw`inline w-4 h-4`);
const tabIcons: { [status in ApplicationStatus]?: ReactNode } = {
  Success: <Icon as={CheckIcon} tw="text-green-600" />,
  Rejected: <Icon as={XMarkIcon} tw="text-red-600" />,
};

const FinaliseCandidates = () => {
  const campaignId = Number(useParams().campaignId);
  const setNavBarTitle = useContext(SetNavBarTitleContext);
  const roleId = Number(useParams().roleId);
  const pushMessage = useContext(MessagePopupContext);
  const roles = useRoles();
  const [organisation, setOrganisation] = useState("ORGANISATION");

  const [emails, setEmails] = useState<{ [id: number]: string }>({});

  const { get: getOrg, loading: orgLoading } =
    useFetch<Organisation>(`/organisation`);

  useFetch<Campaign>(
    `/campaign/${campaignId}`,
    undefined,
    {},
    [],
    async ({ name, organisation_id: orgId }) => {
      setNavBarTitle(name);
      const { data } = await getOrg(`/${orgId}`);
      if (data === undefined) {
        pushMessage({
          type: "error",
          message: "error getting organisation name",
        });
        return;
      }
      setOrganisation(data.name);
    }
  );

  const { data, loading, error, errorMsg } = useFetch<RoleApplications>(
    `/role/${roleId}/applications`,
    undefined,
    {},
    []
  );

  useEffect(() => {
    if (error) {
      pushMessage({
        type: "error",
        message: errorMsg,
      });
    }
  }, [error]);

  useEffect(() => {
    if (data !== null) {
      const newEmails = Object.fromEntries(
        data.applications
          .filter(({ id }) => !(id in emails))
          .map(({ id, private_status: status }) => [
            id,
            emailTemplates[status] ?? "",
          ])
      );
      setEmails({ ...emails, ...newEmails });
    }
  }, [data]);

  const applications = data?.applications ?? [];
  const tabs = useMemo(
    () =>
      applications.map((a) => ({
        id: a.id,
        name: a.user_display_name,
        contents: (
          <div tw="flex">
            <span tw="mx-auto px-1.5">{a.user_display_name}</span>
            <span tw="self-end">{tabIcons[a.private_status]}</span>
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
    (id: number, name: string) =>
      Object.entries(params).reduce(
        (x, [param, value]) => x.replace(`{${param}}`, value),
        emails[id].replace("{name}", name)
      ),
    [emails, params]
  );

  if (loading || orgLoading) {
    return <LoadingIndicator />;
  }

  return (
    <Container tw="max-h-[calc(100vh - 4rem)] flex! flex-col">
      <ReviewerStepper activeStep={2} />

      <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab} vertical>
        <div tw="flex overflow-hidden">
          <Tabs
            tw="p-1 min-w-32 max-w-48 overflow-y-auto"
            tabs={tabs}
            vertical
          />
          <Tab.Panels tw="flex-1 p-1">
            {tabs.map(({ id, name }) => (
              <Tab.Panel key={id} as={Fragment}>
                {preview ? (
                  <Textarea
                    as="div"
                    tw="bg-white border outline-none overflow-hidden whitespace-pre-wrap"
                    size="lg"
                  >
                    <header tw="px-3 py-2 flex items-center bg-gray-100 shadow-sm">
                      <EyeIcon tw="w-4 h-4" /> Preview
                    </header>
                    <div tw="px-3 py-2">{renderEmail(id, name)}</div>
                  </Textarea>
                ) : (
                  <Textarea
                    size="lg"
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
                <Button color="white">
                  Use for all {tabs[selectedTab].status.toLowerCase()}
                </Button>
              </div>
              <div tw="ml-auto flex gap-2">
                <Button color="white" onClick={() => setPreview(!preview)}>
                  {preview ? "Edit" : "Preview"}
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
