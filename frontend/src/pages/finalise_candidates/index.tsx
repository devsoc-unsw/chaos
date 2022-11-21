import { Tab } from "@headlessui/react";
import { Container } from "@mui/material";
import { useContext, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import "twin.macro";

import { LoadingIndicator, ReviewerStepper } from "components";
import Tabs from "components/Tabs";
import Textarea from "components/Textarea";
import { MessagePopupContext } from "contexts/MessagePopupContext";
import { SetNavBarTitleContext } from "contexts/SetNavbarTitleContext";
import useFetch from "hooks/useFetch";

import type { ChangeEvent } from "react";
import type { Campaign, RoleApplications } from "types/api";

const FinaliseCandidates = () => {
  const campaignId = Number(useParams().campaignId);
  const setNavBarTitle = useContext(SetNavBarTitleContext);
  const roleId = Number(useParams().roleId);
  const pushMessage = useContext(MessagePopupContext);

  const [emails, setEmails] = useState<{ [id: number]: string }>({});

  useFetch<Campaign>(`/campaign/${campaignId}`, undefined, {}, [], ({ name }) =>
    setNavBarTitle(name)
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

  const applications = data?.applications ?? [];
  const tabs = useMemo(
    () =>
      applications.map((a) => ({
        id: a.id,
        name: a.user_display_name,
      })) ?? [],
    [data]
  );
  const [selectedTab, setSelectedTab] = useState(0);

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <Container>
      <ReviewerStepper activeStep={2} />

      <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
        <div tw="flex flex-col gap-1">
          <Tabs tabs={tabs} />
          <Tab.Panels>
            {tabs.map(({ id }) => (
              <Tab.Panel
                as={Textarea}
                value={emails[id]}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setEmails({ ...emails, [id]: e.target.value })
                }
              />
            ))}
          </Tab.Panels>
        </div>
      </Tab.Group>
    </Container>
  );
};

export default FinaliseCandidates;
