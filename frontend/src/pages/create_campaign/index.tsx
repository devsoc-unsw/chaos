import { Container, Tab, Tabs } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  createCampaign,
  getAdminData,
  getSelfInfo,
  setCampaignCoverImage,
} from "api";
import { FetchError } from "api/api";
import { dateToStringForBackend, pushToast } from "utils";

import CampaignTab from "./Campaign";
import ReviewTab from "./Preview";
import RolesTab from "./Roles";
import { ArrowIcon, NextButton, NextWrapper } from "./createCampaign.styled";

import type { Answers, Question, Role } from "./types";

const CreateCampaign = () => {
  const orgId = Number(useParams().orgId);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchData = async () => {
      const user = await getSelfInfo();
      const { members: admins } = await getAdminData(orgId);
      const isAdmin = admins.find((member) => member.id === user.id) !== undefined;
      if (!isAdmin) {
        navigate("/");
      }
    };

    void fetchData();
  }, []);

  const [tab, setTab] = useState(0);
  const [campaignName, setCampaignName] = useState("");
  const [startDate, setStartDate] = useState(() => new Date());
  const [endDate, setEndDate] = useState(
    () => new Date(Date.now() + 14 * 3600 * 1000 * 24)
  );
  const [description, setDescription] = useState("");
  const [interviewStage, setInterviewStage] = useState(false);
  const [scoringStage, setScoringStage] = useState(false);
  const [cover, setCover] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleSelected, setRoleSelected] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const campaign = {
    tab,
    setTab,
    campaignName,
    setCampaignName,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    description,
    setDescription,
    interviewStage,
    setInterviewStage,
    scoringStage,
    setScoringStage,
    cover,
    setCover,
    error,
    setError,
    roles,
    setRoles,
    roleSelected,
    setRoleSelected,
    questions,
    setQuestions,
    answers,
    setAnswers,
  };
  const campaignTabIdx = 0;
  const rolesTabIdx = 1;
  const reviewTabIdx = 2;

  const onTabChange = (newTab: number) => {
    // only allow user to access review tab if all inputs are non-empty
    if (newTab === reviewTabIdx) {
      if (campaignName === "") {
        pushToast("Create Campaign", "Campaign name is required!", "error");
        return;
      }
      if (description === "") {
        pushToast(
          "Create Campaign",
          "Campaign description is required!",
          "error"
        );
        return;
      }
      if (cover === null) {
        pushToast(
          "Create Campaign",
          "Campaign cover image is required!",
          "error"
        );
        return;
      }

      if (roles.length === 0) {
        pushToast(
          "Create Campaign",
          "You need to create at least one role",
          "error"
        );
        return;
      }

      const roleMap = new Map<number, Role>();
      const roleCheckSet = new Set<number>();
      let flag = true;

      roles.forEach((role) => {
        roleMap.set(role.id, role);
        roleCheckSet.add(role.id);
      });

      questions.forEach((question) => {
        // Go through all the roles of a question and remove if its not a role
        question.roles.forEach((role) => {
          if (!roleMap.has(role)) {
            question.roles.delete(role);
          }
        });

        if (question.roles.size === 0) {
          pushToast(
            "Create Campaign",
            `The question '${question.text}' is not assigned to a role`,
            "error"
          );
          flag = false;
        } else {
          question.roles.forEach((roleId) => {
            if (roleCheckSet.has(roleId)) {
              roleCheckSet.delete(roleId);
            }
          });
        }
      });

      if (roleCheckSet.size !== 0) {
        flag = false;
        roleCheckSet.forEach((roleID) => {
          const role = roleMap.get(roleID);

          if (role) {
            pushToast(
              "Create Campaign",
              `The role '${role.title}' does not have any questions`,
              "error"
            );
          }
        });
      }

      if (!flag) {
        return;
      }
    }
    setTab(newTab);
  };

  const submitHandler = async (isDraft: boolean) => {
    if (campaignName.length === 0 && !isDraft) {
      setError("Campaign name is required");
      return;
    }
    if (description === "" && !isDraft) {
      setError("Campaign description is required");
      return;
    }
    if (cover === null) {
      setError("Cover image is required");
      return;
    }
    if (startDate.getTime() > endDate.getTime()) {
      setError("Start date must be before end date");
      return;
    }
    if (roles.length === 0 && !isDraft) {
      setError("At least one role is required");
      return;
    }
    if (questions.length === 0 && !isDraft) {
      setError("At least one question is required");
      return;
    }
    setError(null);

    // const coverSend = cover ? cover.slice(cover.indexOf(";base64,") + 8) : "";
    const startTimeDateString = dateToStringForBackend(startDate);
    const endTimeDateString = dateToStringForBackend(endDate);
    const campaignSend = {
      organisation_id: Number(orgId),
      name: campaignName,
      description,
      starts_at: startTimeDateString,
      ends_at: endTimeDateString,
      published: !isDraft,
    };

    const roleQuestions: { [id: string]: number[] } = {};

    const questionsSend = questions.map((q, i) => {
      q.roles.forEach((roleId) => {
        const array = roleQuestions[roleId] ?? [];
        array.push(i);
        roleQuestions[roleId] = array;
      });

      return {
        title: q.text,
        required: q.required ?? true,
      };
    });

    const rolesSend = roles.map((r) => ({
      name: r.title,
      min_available: r.quantity,
      max_available: r.quantity,
      questions_for_role: roleQuestions[r.id] ?? [],
    }));

    try {
      const { id: campaignId } = await createCampaign(
        campaignSend,
        rolesSend,
        questionsSend
      );
      await setCampaignCoverImage(campaignId, cover);
      navigate("/admin");
    } catch (err) {
      if (err instanceof FetchError) {
        try {
          const data = (await err.resp.json()) as string;

          pushToast("Create Campaign", `Internal Error: ${data}`, "error");
        } catch {
          pushToast(
            "Create Campaign",
            "Internal Error: Response Invalid",
            "error"
          );
        }

        return;
      }

      console.error("Something went wrong");
      pushToast(
        "Create Campaign",
        "Something went wrong on the backend!",
        "error"
      );
    }
  };

  return (
    <Container>
      <Tabs
        value={tab}
        onChange={(_e: React.ChangeEvent<HTMLInputElement>, val: number) => onTabChange(val)}
        centered
        style={{ paddingBottom: "30px", paddingTop: "15px" }}
      >
        <Tab label="campaign" />
        <Tab label="roles" />
        <Tab label="review" />
      </Tabs>
      {tab === campaignTabIdx && <CampaignTab campaign={campaign} />}
      {tab === rolesTabIdx && <RolesTab campaign={campaign} />}
      {tab === reviewTabIdx && (
        <ReviewTab
          campaign={campaign}
          onSubmit={(e) => void submitHandler(e)}
        />
      )}
      {(tab === campaignTabIdx || tab === rolesTabIdx) && (
        <NextWrapper>
          <NextButton
            variant="contained"
            onClick={() => {
              onTabChange(tab + 1);
            }}
          >
            Next
            <ArrowIcon />
          </NextButton>
        </NextWrapper>
      )}
    </Container>
  );
};

export default CreateCampaign;
