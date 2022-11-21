import { Tab } from "@headlessui/react";
import { Container } from "@mui/material";
import { useContext, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { LoadingIndicator, ReviewerStepper } from "components";
import Tabs from "components/Tabs";
import { MessagePopupContext } from "contexts/MessagePopupContext";
import { SetNavBarTitleContext } from "contexts/SetNavbarTitleContext";
import useFetch from "hooks/useFetch";

import type { Campaign, RoleApplications } from "types/api";

const FinaliseCandidates = () => {
  const campaignId = Number(useParams().campaignId);
  const setNavBarTitle = useContext(SetNavBarTitleContext);
  const roleId = Number(useParams().roleId);
  const pushMessage = useContext(MessagePopupContext);

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

  const tabs = useMemo(
    () => data?.applications.map((a) => a.user_display_name) ?? [],
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
        <Tabs tabs={tabs} selectedTab={selectedTab} />
      </Tab.Group>
    </Container>
  );
};

export default FinaliseCandidates;
