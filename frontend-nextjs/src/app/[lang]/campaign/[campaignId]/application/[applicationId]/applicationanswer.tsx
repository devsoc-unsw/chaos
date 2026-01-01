"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCampaign, getCampaignRoles } from "@/models/campaign";
import { getInProgressApplication, submitApplication } from "@/models/application";
import { Answer, updateApplicationRoles } from "@/models/answer";
import { useState, useEffect } from "react";
import RoleSelector from "../../../../../../components/applicationanswer/roleselector";
import RoleTabs from "../../../../../../components/applicationanswer/roletabs";
import MainContent from "../../../../../../components/applicationanswer/maincontent";
import ReviewCard from "@/components/applicationanswer/reviewcard";
import { linkQuestionsAndAnswers, Question, QuestionAndAnswer } from "@/models/question";
import { redirect } from "next/navigation";

interface ApplicationReviewProps {
  campaignId: string;
  applicationId: string;
  dict: any;
}

function formatDate(d: string | undefined) {
  if (d !== undefined) {
    return new Intl.DateTimeFormat("en-AU", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }).format(new Date(d));
  }
  return '';
}

export default function ApplicationReview({
  campaignId,
  applicationId,
  dict,
}: ApplicationReviewProps) {
  const { data: campaign } = useQuery({
    queryKey: [`${campaignId}-campaign-info`],
    queryFn: () => getCampaign(campaignId),
  });

  const { data: roles } = useQuery({
    queryKey: [`${campaignId}-campaign-roles`],
    queryFn: () => getCampaignRoles(campaignId),
  });

  const { data: application } = useQuery({
    queryKey: [`application-${applicationId}`],
    queryFn: () => getInProgressApplication(applicationId),
  });

  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"general" | string>("general");
  const [qaByRole, setQAByRole] = useState<Map<string,QuestionAndAnswer[]>>(new Map());
  const queryClient = useQueryClient()

  const populateQAByRole = (roleIds:string[], campaignId: string, applicationId: string) => {
    setQAByRole(prev => {
      const newQAMap = new Map(prev);
      if (!newQAMap.has('general')) {
        const generalQs: Question[] | undefined = queryClient.getQueryData([`${applicationId}-common-questions`]);
        const generalAnswers: Answer[] | undefined = queryClient.getQueryData([`${applicationId}-common-answers`]);
        if (generalQs && generalAnswers) {
          const linkedGeneral = linkQuestionsAndAnswers(generalQs, generalAnswers);
          newQAMap.set('general', linkedGeneral)
        }
      }

      for (const roleId of roleIds) {
        if (newQAMap.has(roleId)) continue;
        const roleQs: Question[] | undefined  = queryClient.getQueryData([`${campaignId}-${roleId}-role-questions`])
        const roleAnswers: Answer[] | undefined = queryClient.getQueryData([`${applicationId}-${roleId}-role-answers`])
        if (roleQs && roleAnswers) {
          const linked = linkQuestionsAndAnswers(roleQs, roleAnswers);
          newQAMap.set(roleId, linked);
        }
      }

      return newQAMap
    })
  }

  const updateQuestionAnswer = (newQA: QuestionAndAnswer) => {
    setQAByRole(prev => {
      const newQAMap = new Map(prev);

      for (const [roleId, questions] of newQAMap.entries()) {
        newQAMap.set(
          roleId,
          questions.map(q =>
            q.question_id === newQA.question_id ? newQA : q
          )
        );
      }

      return newQAMap;
    });
};

  // format roles to match what backend expects
  const buildUpdatedRolesPayload = (orderedIds: string[]) => {
    if (!application?.applied_roles || application.applied_roles.length === 0) {
      return orderedIds.map((campaignRoleId, index) => ({
        campaign_role_id: campaignRoleId,
        preference: index
      }));
    }

    return orderedIds.map((campaignRoleId, index) => {
      const existing = application.applied_roles.find(
        r => String(r.campaign_role_id) === String(campaignRoleId)
      );

      if (!existing) {
        return {
          campaign_role_id: campaignRoleId,
          preference: index
        };
      }

      return {
        campaign_role_id: existing.campaign_role_id,
        preference: index
      };
    });
  };

  // update roles in backend
  const updateRoles = async (nextSelectedRoles: string[]) => {
    setSelectedRoleIds(nextSelectedRoles)
    try {
      const payload = {
        roles: buildUpdatedRolesPayload(nextSelectedRoles),
      };
      await updateApplicationRoles(applicationId, payload.roles);
    } catch (err) {
      console.error("Failed to update roles:", err);
    }
  }

  useEffect(() => {
    if (application?.applied_roles) {
      setSelectedRoleIds(
        [...application.applied_roles]
          .sort((a, b) => a.preference - b.preference)
          .map(r => String(r.campaign_role_id))
      );
    }
  }, [application]);

  const handleApplicationSubmit = async () => {
      try {
        submitApplication(applicationId)
        queryClient.invalidateQueries({ queryKey: [`application-${applicationId}`] });
        redirect(
          `/campaign/${campaignId}/finish`
        );
      } catch (e) {
        console.error("Submission failed: ", e);
      }
  }
  useEffect(() => {
    populateQAByRole(selectedRoleIds,campaignId, applicationId)
    console.log(qaByRole)
  }, [selectedRoleIds]);

  return (
    <div className="min-h-screen bg-background w-full">
      <div className="w-full mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {campaign?.name}
          </h1>
          <h3 className="text-xl text-muted-foreground">
            {formatDate(campaign?.starts_at)} - {formatDate(campaign?.ends_at)}
          </h3>
        </div>
        <div></div>
        <div className="flex gap-8 w-full">
          <RoleSelector roles={roles} maxRolesPerApplication={campaign?.max_roles_per_application} selectedRoleIds={selectedRoleIds} onChangeSelectedRoles={updateRoles} applicationId={applicationId} dict={dict}/>
          <div className="flex-1">
            <RoleTabs roles={roles} selectedRoleIds={selectedRoleIds} activeTab={activeTab} onChangeActiveTab={setActiveTab} dict={dict}/>
            <MainContent campaignId={campaignId} applicationId={applicationId} activeTab={activeTab} dict={dict} updateRoleAnswers={updateQuestionAnswer}/>
            <ReviewCard questionsAndAnswersByRole={qaByRole} roles={roles} applicationId={applicationId} handleSubmit={handleApplicationSubmit} dict={dict}/>
          </div>
        </div>
      </div>
    </div>
  );
}