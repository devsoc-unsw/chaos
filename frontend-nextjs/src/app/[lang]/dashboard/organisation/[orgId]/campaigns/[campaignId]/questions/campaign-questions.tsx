"use client";

import { dateToString } from "@/lib/utils";
import { getCampaign, getCampaignRoles, RoleDetails } from "@/models/campaign";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, GripVertical, X } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAllCommonQuestions, getAllRoleQuestions, MultiOptionQuestionOption, Question } from "@/models/question";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd';
import { v4 as uuidv4 } from 'uuid';

export default function CampaignQuestions({ campaignId, orgId, dict }: { campaignId: string, orgId: string, dict: any }) {
    const { data: campaign } = useQuery({
        queryKey: [`${campaignId}-campaign-details`],
        queryFn: () => getCampaign(campaignId),
    });

    const { data: roles } = useQuery({
        queryKey: [`${campaignId}-campaign-roles`],
        queryFn: () => getCampaignRoles(campaignId),
    });

    return (
        <div>
            <div className="flex justify-between items-center">
                <div>
                    <Link href={`/dashboard/organisation/${orgId}/campaigns/${campaignId}`}>
                        <div className="flex items-center gap-1">
                            <ArrowLeft className="w-4 h-4" />
                            {dict.common.back}
                        </div>
                    </Link>
                    <h1 className="text-2xl font-bold">{dict.dashboard.campaigns.campaign_questions}</h1>
                    <h2 className="text-lg font-medium">{campaign?.name}</h2>
                </div>
            </div>
            <div className="mt-2 pb-10">
                <Tabs defaultValue="common" className="max-w-[1000px]">
                    <TabsList>
                        <TabsTrigger value="common">Common</TabsTrigger>
                        {roles?.map((role) => (
                            <TabsTrigger key={role.id} value={role.id}>{role.name}</TabsTrigger>
                        ))}
                    </TabsList>
                    <TabsContent value="common">
                        <QuestionEditor campaignId={campaignId} dict={dict} />
                    </TabsContent>
                    {roles?.map((role) => (
                        <TabsContent key={role.id} value={role.id}>
                            <QuestionEditor campaignId={campaignId} possibleRole={role} dict={dict} />
                        </TabsContent>
                    ))}
                </Tabs>
            </div>
        </div>
    );
}

function QuestionEditor({ campaignId, possibleRole, dict }: { campaignId: string, possibleRole?: RoleDetails, dict: any }) {
    const roleId = possibleRole?.id ?? "common";

    let questions: Question[] = [];

    if (roleId === "common") {
        const { data } = useQuery({
            queryKey: [`${campaignId}-common-questions`],
            queryFn: () => getAllCommonQuestions(campaignId),
        });

        questions = data ?? [];
    } else {
        const { data } = useQuery({
            queryKey: [`${campaignId}-role-questions-${roleId}`],
            queryFn: () => getAllRoleQuestions(campaignId, roleId),
        });

        questions = data ?? [];
    }

    return (
        <div className="flex flex-col gap-2">
            {questions?.map((question) => {
                if (question.question_type !== 'ShortAnswer') {
                    return <MultiOptionQuestionCard key={question.id} question={question} dict={dict} />
                }
                return <ShortAnswerQuestionCard key={question.id} question={question} dict={dict} />;
            })}
        </div>
    );
}

function MultiOptionQuestionCard({ question, dict }: { question?: Question, dict: any }) {
    const [title, setTitle] = useState(question?.title ?? "");
    // const [description, setDescription] = useState(question?.description ?? "");
    const [questionType, setQuestionType] = useState(question?.question_type ?? "");
    const [options, setOptions] = useState(question?.data?.options ?? []);

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) {
            return;
        }

        const items = Array.from(options);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        const newItems = items.map((option, index) => ({ ...option, display_order: index + 1 }));

        setOptions(newItems);
    }

    const addOption = (text: string) => {
        // Generate random id for use with DnD
        const newItems: MultiOptionQuestionOption[] = [...options, { id: uuidv4(), text: text, display_order: options.length + 1 }];
        setOptions(newItems);
    }

    const removeOption = (id: string) => {
        const newItems = options.filter((option) => option.id !== id);
        setOptions(newItems);
    }

    return (
        <div className="flex flex-col p-2 border rounded-md gap-2 w">
            <div className="flex items-center justify-between gap-2">
                <Input className="max-w-[500px]" value={title} onChange={(e) => setTitle(e.target.value)} />
                <Select value={questionType} onValueChange={(value) => setQuestionType(value)}>
                    <SelectTrigger>
                        <SelectValue placeholder={dict.common.question_type} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="MultiChoice">{dict.common.question_types.multi_choice}</SelectItem>
                        <SelectItem value="MultiSelect">{dict.common.question_types.multi_select}</SelectItem>
                        <SelectItem value="DropDown">{dict.common.question_types.dropdown}</SelectItem>
                        <SelectItem value="Ranking">{dict.common.question_types.ranking}</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {/* Hide description field */}
            {/* <div className="flex flex-col gap-1">
                <Label>{dict.common.description}</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div> */}
            <div>
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="options-box">
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="flex flex-col"
                            >
                                {options.map((option, index) => (
                                    <Draggable key={option.id} draggableId={option.id} index={index}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className="p-2 my-1 flex justify-between items-center gap-2"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <GripVertical className="w-4 h-4" />
                                                    <OptionDecorator questionType={questionType} index={index} />
                                                    {option.text}
                                                </div>
                                                <X className="w-5 h-5 cursor-pointer text-red-500 hover:text-red-600" onClick={() => removeOption(option.id)} />
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
                <div
                    className="p-2 flex items-start gap-2"
                >
                    <GripVertical className="w-4 h-4 mt-1" />
                    <div className="mt-1">
                        <OptionDecorator questionType={questionType} index={options.length} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <input className="w-full focus:outline-none border-b-2 border-dotted border-gray-500 max-w-[300px]" placeholder={dict.dashboard.campaigns.questions.add_option} onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                addOption((e.target as HTMLInputElement).value);
                                (e.target as HTMLInputElement).value = '';
                            }
                        }} />
                        <p className="text-xs text-gray-500">{dict.dashboard.campaigns.questions.option_help}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function OptionDecorator({ questionType, index }: { questionType: string, index: number }) {
    if (questionType === 'MultiChoice') {
        return <div className="rounded-full border-2 border-gray-500 w-4 h-4"></div>;
    } else if (questionType === 'MultiSelect') {
        return <div className="rounded-xs border-2 border-gray-500 w-4 h-4"></div>;
    } else if (questionType === 'DropDown') {
        return <div className=""></div>;
    } else if (questionType === 'Ranking') {
        return <div className=""></div>;
    }
    return <div className="rounded-full border-2 border-gray-500 w-4 h-4"></div>;
}

function ShortAnswerQuestionCard({ question, dict }: { question?: Question, dict: any }) {
    const [title, setTitle] = useState(question?.title ?? "");

    return (
        <div className="flex flex-col justify-between p-2 border rounded-md gap-2 min-h-[120px]">
            <Input className="max-w-[500px]" value={title} onChange={(e) => setTitle(e.target.value)} />
            {/* Hide description field */}
            {/* <div className="flex flex-col gap-1">
                <Label>{dict.common.description}</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div> */}
            <div className="flex flex-col gap-1 p-2">
                <div className="border-b-2 border-dotted border-gray-500 max-w-[300px]">
                    <p className="text-sm text-gray-500">{dict.dashboard.campaigns.questions.answer_text}</p>
                </div>
            </div>
        </div>
    );
}