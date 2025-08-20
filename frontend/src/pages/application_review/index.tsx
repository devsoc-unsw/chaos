import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import ShortAnswer from "components/QuestionComponents/ShortAnswer";
import Dropdown from "components/QuestionComponents/Dropdown";
import MultiChoice from "components/QuestionComponents/MultiChoice";
import MultiSelect from "components/QuestionComponents/MultiSelect";
import Ranking from "components/QuestionComponents/Ranking";
import { getCampaign, getCampaignRoles, getCommonQuestions, getRoleQuestions, createOrGetApplication } from "api";
import type { Campaign, Role, QuestionResponse, QuestionData } from "types/api";
import { Button } from "components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "components/ui/dialog";
import { Info } from "lucide-react";

const ApplicationReview: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"general" | string>("general");
  const [commonQuestions, setCommonQuestions] = useState<QuestionResponse[]>([]);
  const [questionsByRole, setQuestionsByRole] = useState<Record<string, QuestionResponse[]>>({});
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId) return;
    (async () => {
      setLoading(true);
      try {
        const idStr = campaignId;
        const [c, r, common, application] = await Promise.all([
          getCampaign(idStr),
          getCampaignRoles(idStr),
          getCommonQuestions(idStr),
          createOrGetApplication(idStr),
        ]);
        setCampaign(c);
        setRoles(r);
        setApplicationId(application.application_id);
        const commonList = Array.isArray(common)
          ? common
          : (common as unknown as { questions?: QuestionResponse[] }).questions ?? [];
        setCommonQuestions(commonList);
      } finally {
        setLoading(false);
      }
    })();
  }, [campaignId]);

  // Fetch role-specific questions when a new role is selected
  useEffect(() => {
    if (!campaignId) return;
    const id = campaignId;
    const missing = selectedRoleIds.filter((rid) => questionsByRole[rid] === undefined);
    if (missing.length === 0) return;
    (async () => {
      const updates: Record<string, QuestionResponse[]> = {};
      await Promise.all(
        missing.map(async (rid) => {
          const resp = await getRoleQuestions(id, rid);
          updates[rid] = Array.isArray(resp)
            ? resp
            : (resp as unknown as { questions?: QuestionResponse[] }).questions ?? [];
        })
      );
      setQuestionsByRole((prev) => ({ ...prev, ...updates }));
    })();
  }, [selectedRoleIds, campaignId, questionsByRole]);

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev: string[]) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  const setAnswer = (questionId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const formatAnswer = (question: QuestionResponse, answer: unknown): string => {
    if (answer === null || answer === undefined || answer === '') {
      return "No answer provided";
    }

    switch (question.question_type) {
      case "ShortAnswer":
        return String(answer);
      
      case "MultiChoice":
      case "DropDown":
        const selectedOption = question.data.options.find(opt => opt.id === answer);
        return selectedOption ? selectedOption.text : String(answer);
      
      case "MultiSelect":
      case "Ranking":
        if (Array.isArray(answer)) {
          const selectedOptions = question.data.options
            .filter(opt => answer.includes(opt.id))
            .map(opt => opt.text);
          return selectedOptions.length > 0 ? selectedOptions.join(", ") : "No selections";
        }
        return String(answer);
      
      default:
        return String(answer);
    }
  };

  const renderQuestion = (q: QuestionResponse) => {
    const options = (q.question_type === "MultiChoice" || q.question_type === "MultiSelect" || q.question_type === "DropDown" || q.question_type === "Ranking")
      ? (q.data.options.map((o) => ({ id: o.id, label: o.text })) ?? [])
      : [];
    const idStr = String(q.id);

    switch (q.question_type) {
      case "ShortAnswer":
        return (
          <ShortAnswer
            key={idStr}
            id={idStr}
            question={q.title}
            description={q.description}
            required={q.required}
            defaultValue={(answers[idStr] as string) ?? ""}
            onSubmit={(qid, val) => setAnswer(qid, val)}
          />
        );
      case "DropDown":
        return (
          <Dropdown
            key={idStr}
            id={idStr}
            question={q.title}
            description={q.description}
            required={q.required}
            options={options}
            defaultValue={answers[idStr] as string | number | undefined}
            onSubmit={(qid, val) => setAnswer(qid, val)}
          />
        );
      case "MultiChoice":
        return (
          <MultiChoice
            key={idStr}
            id={idStr}
            question={q.title}
            description={q.description}
            required={q.required}
            options={options}
            defaultValue={answers[idStr] as string | number | undefined}
            onSubmit={(qid, val) => setAnswer(qid, val)}
          />
        );
      case "MultiSelect":
        return (
          <MultiSelect
            key={idStr}
            id={idStr}
            question={q.title}
            description={q.description}
            required={q.required}
            options={options}
            defaultValue={(answers[idStr] as Array<string | number>) ?? []}
            onSubmit={(qid, val) => setAnswer(qid, val)}
          />
        );
      case "Ranking":
        return (
          <Ranking
            key={idStr}
            id={idStr}
            question={q.title}
            description={q.description}
            required={q.required}
            options={options}
            defaultValue={(answers[idStr] as Array<string | number>) ?? []}
            onSubmit={(qid, val) => setAnswer(qid, val)}
          />
        );
      default:
        return null;
    }
  };

  if (loading || !campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading campaign data...</p>
        </div>
      </div>
    );
  }

  const activeRole = activeTab !== "general" ? roles.find((r) => String(r.id) === activeTab) : undefined;
  const activeRoleQuestions = activeTab !== "general" ? questionsByRole[activeTab] ?? [] : [];

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <div className="w-full mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{campaign.name}</h1>
          <p className="text-gray-600">
            {new Date(campaign.starts_at).toLocaleDateString()} - {new Date(campaign.ends_at).toLocaleDateString()}
          </p>
          {applicationId && (
            <p className="text-sm text-gray-500 mt-2">
              Application ID: {applicationId}
            </p>
          )}
        </div>

        <div className="flex gap-8 w-full">
          {/* Sidebar – multi-select roles */}
          <div className="w-80 flex-shrink-0">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Available Roles</h2>
            <div className="space-y-2">
              {roles.map((role) => {
                const selected = selectedRoleIds.includes(String(role.id));
                return (
                  <div
                    key={role.id}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selected ? "bg-blue-50 border-blue-300" : "bg-white border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => toggleRole(String(role.id))}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm">{role.name}</h3>
                      <div className="flex items-center gap-2">
                        {role.description && (
                          <div className="group relative">
                            <Info tw="h-4 w-4 text-blue-500 hover:text-blue-600 transition-colors" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                              {role.description}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        )}
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          selected 
                            ? "bg-blue-100 text-blue-700" 
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          {selected ? "Selected" : "Select"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Tabs: General + selected roles */}
            <div className="flex border-b border-gray-200 mb-6 gap-2">
              <button
                className={`px-4 py-2 font-medium ${
                  activeTab === "general" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("general")}
              >
                General
              </button>
              {selectedRoleIds.map((rid) => (
                <button
                  key={rid}
                  className={`px-4 py-2 font-medium ${
                    activeTab === rid ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab(rid)}
                >
                  {roles.find((r) => String(r.id) === rid)?.name ?? `Role ${rid}`}
                </button>
              ))}
            </div>

            {/* General questions */}
            {activeTab === "general" && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                {commonQuestions.length === 0 ? (
                  <p className="text-gray-600">No general questions.</p>
                ) : (
                  <div className="space-y-6">{commonQuestions.map(renderQuestion)}</div>
                )}
              </div>
            )}

            {/* Role-specific questions */}
            {activeTab !== "general" && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {activeRole?.name ?? "Role"} Questions
                </h3>
                {activeRoleQuestions.length === 0 ? (
                  <p className="text-gray-600">No role-specific questions.</p>
                ) : (
                  <div className="space-y-6">{activeRoleQuestions.map(renderQuestion)}</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Review Answers Button - Fixed position bottom right */}
        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <DialogTrigger asChild>
            <Button 
              className="fixed bottom-8 right-8 shadow-lg"
              size="lg"
            >
              Review Answers
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Application Review Summary
                {applicationId && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    (ID: {applicationId})
                  </span>
                )}
              </DialogTitle>
            </DialogHeader>
            
            {/* Applied Roles Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Applied Roles:</h3>
              {selectedRoleIds.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedRoleIds.map((roleId) => {
                    const role = roles.find(r => String(r.id) === roleId);
                    return (
                      <span 
                        key={roleId}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {role?.name || `Role ${roleId}`}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-600">No roles selected</p>
              )}
            </div>

            {/* Common Questions Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">General Questions:</h3>
              {commonQuestions.length > 0 ? (
                <div className="space-y-4">
                  {commonQuestions.map((question) => (
                    <div key={question.id} className="border-l-4 border-gray-200 pl-4">
                      <h4 className="font-medium text-gray-900 mb-1">{question.title}</h4>
                      {question.description && (
                        <p className="text-sm text-gray-600 mb-2">{question.description}</p>
                      )}
                      <p className="text-gray-800 bg-gray-50 p-2 rounded">
                        {formatAnswer(question, answers[String(question.id)])}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No general questions</p>
              )}
            </div>

            {/* Role-specific Questions Sections */}
            {selectedRoleIds.map((roleId) => {
              const role = roles.find(r => String(r.id) === roleId);
              const roleQuestions = questionsByRole[roleId] || [];
              
              return (
                <div key={roleId} className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">
                    {role?.name || `Role ${roleId}`} Questions:
                  </h3>
                  {roleQuestions.length > 0 ? (
                    <div className="space-y-4">
                      {roleQuestions.map((question) => (
                        <div key={question.id} className="border-l-4 border-blue-200 pl-4">
                          <h4 className="font-medium text-gray-900 mb-1">{question.title}</h4>
                          {question.description && (
                            <p className="text-sm text-gray-600 mb-2">{question.description}</p>
                          )}
                          <p className="text-gray-800 bg-blue-50 p-2 rounded">
                            {formatAnswer(question, answers[String(question.id)])}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No questions for this role</p>
                  )}
                </div>
              );
            })}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ApplicationReview;