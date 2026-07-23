"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCampaign, getCampaignRoles } from "@/models/campaign";
import { getInProgressApplication, submitApplication } from "@/models/application";
import { Answer, getAllCommonAnswers, updateApplicationRoles } from "@/models/answer";
import { useState, useEffect } from "react";
import RoleSelector from "@components/application-answer/role-selector";
import RoleTabs from "@components/application-answer/role-tabs";
import MainContent from "@components/application-answer/main-content";
import TabSwitcher from "@components/application-answer/tab-switcher";
import ReviewCard from "@components/application-answer/review-card";
import { getAllCommonQuestions, linkQuestionsAndAnswers, Question, QuestionAndAnswer } from "@/models/question";
import { getAllRoleAnswers } from "@/models/answer";
import { getAllRoleQuestions } from "@/models/question";
import { redirect, useRouter } from "next/navigation";
import { toast } from "sonner";

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
  const [rolePercentages, setRolePercentages] = useState<Record<string, number>>({});
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
        if (newQAMap.has(roleId)) continue;
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

  // even split across n roles that always sums to exactly 100 (remainder on the last role)
  const evenSplit = (n: number): number[] => {
    if (n === 0) return [];
    const base = Math.floor(100 / n);
    const splits = Array(n).fill(base);
    splits[n - 1] += 100 - base * n;
    return splits;
  };

  // format roles to match what backend expects
  const buildUpdatedRolesPayload = (orderedIds: string[], percentages: Record<string, number>) => {
    return orderedIds.map((campaignRoleId) => ({
      campaign_role_id: campaignRoleId,
      preference_percentage: percentages[campaignRoleId] ?? 0,
    }));
  };

  // update roles in backend
  const updateRoles = async (nextSelectedRoles: string[]) => {
    const lengthChanged = nextSelectedRoles.length !== selectedRoleIds.length;
    const nextPercentages = lengthChanged
      ? Object.fromEntries(
          nextSelectedRoles.map((id, i) => [id, evenSplit(nextSelectedRoles.length)[i]])
        )
      : rolePercentages;

    setSelectedRoleIds(nextSelectedRoles)
    if (lengthChanged) setRolePercentages(nextPercentages);
    if (activeTab !== "general" && !nextSelectedRoles.includes(activeTab)) {
      setActiveTab("general");
    }
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
      const payload = buildUpdatedRolesPayload(nextSelectedRoles, nextPercentages);
      await updateApplicationRoles(applicationId, payload);
    } catch (err) {
      console.error("Failed to update roles:", err);
    }
  }

  // update a single role's percentage (does not change selection or order)
  const handlePercentageChange = async (campaignRoleId: string, value: number) => {
    const nextPercentages = { ...rolePercentages, [campaignRoleId]: value };
    setRolePercentages(nextPercentages);

    try {
      const payload = buildUpdatedRolesPayload(selectedRoleIds, nextPercentages);
      await updateApplicationRoles(applicationId, payload);
    } catch (err) {
      console.error("Failed to update role preference:", err);
    }
  };

  useEffect(() => {
    if (application?.applied_roles) {
      const sorted = [...application.applied_roles].sort(
        (a, b) => b.preference_percentage - a.preference_percentage
      );
      setSelectedRoleIds(sorted.map(r => String(r.campaign_role_id)));
      setRolePercentages(
        Object.fromEntries(sorted.map(r => [String(r.campaign_role_id), r.preference_percentage]))
      );
    }
  }, [application]);

  const handleApplicationSubmit = async () => {
    try {
      await submitApplication(applicationId)
      queryClient.invalidateQueries({ queryKey: [`application-${applicationId}`] });
      router.push(`/campaign/apply/${campaignId}/finish`);
    } catch (e: any) {
      console.error("Submission failed: ", e);
      toast.error(e?.message || "Failed to submit application. Please try again.");
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
    <div className="min-h-screen w-full overflow-x-hidden bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-2 break-words text-2xl font-bold text-foreground sm:text-3xl">
            {campaign?.name}
          </h1>
          <h3 className="text-base text-muted-foreground sm:text-xl">
            {formatDate(campaign?.starts_at)} - {formatDate(campaign?.ends_at)}
          </h3>
        </div>
        <div></div>
        <div className="flex w-full flex-col gap-4 lg:gap-8 xl:flex-row">
          <div className="w-full xl:w-80 xl:shrink-0">
            <RoleSelector roles={roles} maxRolesPerApplication={campaign?.max_roles_per_application} selectedRoleIds={selectedRoleIds} onChangeSelectedRoles={updateRoles} rolePercentages={rolePercentages} onChangeRolePercentage={handlePercentageChange} applicationId={applicationId} dict={dict} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="overflow-x-auto pb-1">
              <RoleTabs roles={roles} selectedRoleIds={selectedRoleIds} activeTab={activeTab} onChangeActiveTab={setActiveTab} dict={dict} />
            </div>
            <div className="relative pb-12 sm:pb-14">
              <MainContent campaignId={campaignId} applicationId={applicationId} activeTab={activeTab} dict={dict} updateRoleAnswers={updateQuestionAnswer} qaByRole={qaByRole} />
              <TabSwitcher roles={roles} selectedRoleIds={selectedRoleIds} activeTab={activeTab} onChangeActiveTab={setActiveTab} dict={dict} />
            </div>
            <ReviewCard questionsAndAnswersByRole={qaByRole} selectedRoleIds={selectedRoleIds} rolePercentages={rolePercentages} roles={roles} applicationId={applicationId} handleSubmit={handleApplicationSubmit} dict={dict} />
          </div>
        </div>
      </div>
    </div>
  );
}