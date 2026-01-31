"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCampaign, getCampaignRoles } from "@/models/campaign";
import { getInProgressApplication, submitApplication } from "@/models/application";
import { Answer, getAllCommonAnswers, updateApplicationRoles } from "@/models/answer";
import { useState, useEffect } from "react";
import RoleSelector from "../../../../../../../components/application-answer/role-selector";
import RoleTabs from "../../../../../../../components/application-answer/role-tabs";
import MainContent from "../../../../../../../components/application-answer/main-content";
import ReviewCard from "@/components/application-answer/review-card";
import { getAllCommonQuestions, linkQuestionsAndAnswers, Question, QuestionAndAnswer } from "@/models/question";
import { getAllRoleAnswers } from "@/models/answer";
import { getAllRoleQuestions } from "@/models/question";
import { redirect, useRouter } from "next/navigation";

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
  const router = useRouter();
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
  const [qaByRole, setQAByRole] = useState<Map<string, QuestionAndAnswer[]>>(new Map());
  const queryClient = useQueryClient()

  // always fetch general qAndAs on load
  useEffect(() => {
    (async () => {
      try {
        const [generalQs, generalAnswers] = await Promise.all([
          queryClient.fetchQuery({
            queryKey: [`${applicationId}-common-questions`],
            queryFn: () => getAllCommonQuestions(campaignId),
          }),
          queryClient.fetchQuery({
            queryKey: [`${applicationId}-common-answers`],
            queryFn: () => getAllCommonAnswers(applicationId),
          }),
        ]);

        const linkedGeneral = linkQuestionsAndAnswers(generalQs, generalAnswers);

        setQAByRole(prev => {
          const newMap = new Map(prev);
          newMap.set("general", linkedGeneral);
          return newMap;
        });
      } catch (err) {
        console.error("Failed to fetch general questions/answers", err);
      }
    })();
  }, [campaignId, applicationId, queryClient]);

  const populateQAByRole = (roleIds: string[], campaignId: string, applicationId: string) => {
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
        //if (newQAMap.has(roleId)) continue;
        const roleQs: Question[] | undefined = queryClient.getQueryData([`${campaignId}-${roleId}-role-questions`])
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
    setQAByRole(prev => {
      const newQAMap = new Map<string, QuestionAndAnswer[]>();
      if (prev.has('general')) {
        newQAMap.set('general', prev.get('general')!);
      }

      for (const roleId of nextSelectedRoles) {
        if (prev.has(roleId)) {
          newQAMap.set(roleId, prev.get(roleId)!);
        } else {
          const roleQs: Question[] | undefined = queryClient.getQueryData([`${campaignId}-${roleId}-role-questions`]);
          const roleAnswers: Answer[] | undefined = queryClient.getQueryData([`${applicationId}-${roleId}-role-answers`]);
          if (roleQs && roleAnswers) {
            const linked = linkQuestionsAndAnswers(roleQs, roleAnswers);
            newQAMap.set(roleId, linked);
          } else {
            (async () => {
              try {
                const [roleQs, roleAnswers] = await Promise.all([
                  queryClient.fetchQuery({
                    queryKey: [`${campaignId}-${roleId}-role-questions`],
                    queryFn: () => getAllRoleQuestions(campaignId, roleId),
                  }),
                  queryClient.fetchQuery({
                    queryKey: [`${applicationId}-${roleId}-role-answers`],
                    queryFn: () => getAllRoleAnswers(applicationId, roleId),
                  }),
                ]);

                const linked = linkQuestionsAndAnswers(roleQs, roleAnswers);

                setQAByRole(prevInner => {
                  const updated = new Map(prevInner);
                  updated.set(roleId, linked);
                  return updated;
                });
              } catch (err) {
                console.error(`Failed to fetch QAs for role ${roleId}:`, err);
              }
            })();
          }
        }
      }

      return newQAMap;
    });

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
      await submitApplication(applicationId)
      queryClient.invalidateQueries({ queryKey: [`application-${applicationId}`] });
      router.push(`/campaign/apply/${campaignId}/finish`);
    } catch (e) {
      console.error("Submission failed: ", e);
    }
  }

  useEffect(() => {
    if (selectedRoleIds.length === 0) return;

    const allRoleQueriesReady = selectedRoleIds.every(roleId => {
      const roleQs = queryClient.getQueryData([`${campaignId}-${roleId}-role-questions`]);
      const roleAnswers = queryClient.getQueryData([`${applicationId}-${roleId}-role-answers`]);
      return roleQs !== undefined && roleAnswers !== undefined;
    });

    if (allRoleQueriesReady) {
      populateQAByRole(selectedRoleIds, campaignId, applicationId);
    }
  }, [selectedRoleIds, campaignId, applicationId, queryClient]);

  return (
    <div className="min-h-screen bg-background w-full overflow-y-scroll [&::-webkit-scrollbar]:hidden">
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
          <RoleSelector roles={roles} maxRolesPerApplication={campaign?.max_roles_per_application} selectedRoleIds={selectedRoleIds} onChangeSelectedRoles={updateRoles} applicationId={applicationId} dict={dict} />
          <div className="flex-1">
            <RoleTabs roles={roles} selectedRoleIds={selectedRoleIds} activeTab={activeTab} onChangeActiveTab={setActiveTab} dict={dict} />
            <MainContent campaignId={campaignId} applicationId={applicationId} activeTab={activeTab} dict={dict} updateRoleAnswers={updateQuestionAnswer} />
            <ReviewCard questionsAndAnswersByRole={qaByRole} selectedRoleIds={selectedRoleIds} roles={roles} applicationId={applicationId} handleSubmit={handleApplicationSubmit} dict={dict} />
          </div>
        </div>
      </div>
    </div>
  );
}
