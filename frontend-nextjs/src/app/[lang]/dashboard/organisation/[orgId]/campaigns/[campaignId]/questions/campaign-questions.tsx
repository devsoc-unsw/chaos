"use client";

import { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react"
import Link from "next/link"
import { dateToString, cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getCampaign } from "@/models/campaign";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import QuestionTemplateEditor from "./question-template-editor";
import { 
    getCampaignQuestionTemplates,
    uploadCampaignQuestionTemplate, 
    updateCampaignQuestionTemplate,
    deleteCampaignQuestionTemplate 
} from "@/models/interview_questions";
import { toast } from "sonner";

import { TemplateData, QuestionTemplate } from "@/models/interview_questions";

import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { ButtonGroup } from "@/components/ui/button-group";
import { ca } from "date-fns/locale";

export default function CampaignQuestions( {campaignId, orgId, dict} : {campaignId: string, orgId: string, dict: any}) {
    const [showTemplateEditor, setShowTemplateEditor] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<QuestionTemplate | null>(null);
    const queryClient = useQueryClient();
    
    const { data: campaign } = useQuery({
        queryKey: [`${campaignId}-campaign-details`],
        queryFn: () => getCampaign(campaignId),
    });

    const { data: campaignTemplates } = useQuery({
        queryKey: [`${campaignId}-campaign-templates`],
        queryFn: () => getCampaignQuestionTemplates(campaignId),
    });

    const { mutateAsync: mutateCreateTemplate } = useMutation({
        mutationFn: ( data: TemplateData ) => uploadCampaignQuestionTemplate(campaignId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-campaign-templates`]});
            toast.success(dict.dashboard.campaigns.template_editor.template_created_success);
            setShowTemplateEditor(false);
        },
        onError: (error) => {
            toast.error(`${dict.dashboard.campaigns.template_editor.template_create_error}: ${error instanceof Error ? error.message : dict.dashboard.campaigns.template_editor.unknown_error}`);
        },
    });

    const { mutateAsync: mutateUpdateTemplate } = useMutation({
        mutationFn: ({templateId, data}: {templateId: string, data: TemplateData}) => updateCampaignQuestionTemplate(campaignId, templateId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: [`${campaignId}-campaign-templates`]});
        },
        onError: (error) => {
            toast.error(`${dict.dashboard.campaigns.template_editor.template_update_error}: ${error instanceof Error ? error.message : dict.dashboard.campaigns.template_editor.unknown_error}`);
        },
    });

    const { mutateAsync: mutateDeleteTemplate } = useMutation({
        mutationFn: (templateId: string) => deleteCampaignQuestionTemplate(campaignId, templateId),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: [`${campaignId}-campaign-templates`]});
            toast.success(dict.dashboard.campaigns.template_editor.template_deleted_success);
            setShowTemplateEditor(false);
        },
        onError: (error) => {
            toast.error(`${dict.dashboard.campaigns.template_editor.template_delete_error}: ${error instanceof Error ? error.message : dict.dashboard.campaigns.template_editor.unknown_error}`);
        }
    });

    const handleSaveTemplate = async (template: TemplateData) => {
        try {
            if (selectedTemplate) {
                // Update existing template
                await mutateUpdateTemplate({ templateId: selectedTemplate.template_id.toString(), data: template });
            } else {
                // Create new template
                await mutateCreateTemplate(template);
            }
            setSelectedTemplate(null);
        } catch (error) {
            // Error handling is done in onError callback
        }
    };

    const handleTemplateClick = (template: QuestionTemplate) => {
        setSelectedTemplate(template);
        setShowTemplateEditor(true);
    };

    const handleNewTemplate = () => {
        setSelectedTemplate(null);
        setShowTemplateEditor(true);
    };

    const handleCancelEditor = () => {
        setShowTemplateEditor(false);
        setSelectedTemplate(null);
    };

    const handleUpdateTemplate = async (templateId: string, templateUpdate: TemplateData) => {
        try {
            await mutateUpdateTemplate({templateId: templateId, data: templateUpdate});
        } catch (error) {
            // Error handling is done in onError callback
        }
    };

    const handleDeleteTemplate = async (templateId: string) => {
        try {
            await mutateDeleteTemplate(templateId);
        } catch (error) {
            // Error handling is done in onError callback
        }
    };

    return (
        <div className="flex flex-col gap-2 h-[calc(100vh-140px)] overflow-hidden">
            <div className="flex items-center flex-shrink-0">
                <Link href={`/dashboard/organisation/${orgId}/campaigns/${campaignId}`} className="flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" />
                    {dict.common.back}
                </Link>
            </div>

            <div className="relative flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-bold">{dict.dashboard.campaigns.questions}</h1>
                    <h2 className="text-lg font-medium">{campaign?.name}</h2>
                    <p className="text-sm text-gray-500">{dateToString(campaign?.starts_at ?? "")} - {dateToString(campaign?.ends_at ?? "")}</p>
                </div>

                <ButtonGroup className="absolute bottom-0 right-0 inline-flex items-center gap-2">
                    <Button 
                        className="cursor-pointer"
                        onClick={handleNewTemplate}
                    >
                        <Plus className="w-4 h-4"></Plus>
                        {dict.dashboard.campaigns.add_question_template}
                    </Button>
                </ButtonGroup>
            </div>

            {/* Application review component */}
            <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0 max-h-full rounded-lg border overflow-hidden">
                <ResizablePanel defaultSize={20}>
                    <ScrollArea className="h-full">
                        {campaignTemplates?.map(template => (
                            <div 
                                key={template.template_id} 
                                className={cn(
                                    "px-2 py-3 border-b hover:cursor-pointer hover:bg-muted",
                                    selectedTemplate?.template_id === template.template_id && "bg-muted"
                                )}
                                onClick={() => handleTemplateClick(template)}
                            >
                                <p className="text-sm font-medium">{template.template_name}</p>
                            </div>
                        ))}
                    </ScrollArea>
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={80}>
                    {showTemplateEditor ? (
                        <div className="h-full p-4 overflow-hidden">
                            <QuestionTemplateEditor
                                dict={dict}
                                initialTemplate={selectedTemplate}
                                onSave={handleSaveTemplate}
                                onUpdate={handleUpdateTemplate}
                                onCancel={handleCancelEditor}
                                onDelete={() => {
                                    if (selectedTemplate) {
                                        handleDeleteTemplate(selectedTemplate.template_id.toString());
                                    }
                                }}
                            />
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-500">
                            {dict.dashboard.campaigns.template_editor.select_template_message}
                        </div>
                    )}
                </ResizablePanel>
            </ResizablePanelGroup>

        </div>
    )
}