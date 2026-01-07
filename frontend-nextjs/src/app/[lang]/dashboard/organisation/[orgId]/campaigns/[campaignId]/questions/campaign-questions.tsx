"use client";

import { dateToString } from "@/lib/utils";
import { getCampaign, getCampaignRoles, RoleDetails } from "@/models/campaign";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, GripVertical, Plus, Trash, X } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createQuestion, deleteQuestion, getAllCommonQuestions, getAllRoleQuestions, MultiOptionQuestionOption, Question, QuestionType, updateQuestion } from "@/models/question";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd';
import { snowflakeGenerator } from "@/lib";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export default function CampaignQuestions({ campaignId, orgId, dict }: { campaignId: string, orgId: string, dict: any }) {
    const queryClient = useQueryClient();
    
    const { data: campaign } = useQuery({
        queryKey: [`${campaignId}-campaign-details`],
        queryFn: () => getCampaign(campaignId),
    });

    const { data: roles } = useQuery({
        queryKey: [`${campaignId}-campaign-roles`],
        queryFn: () => getCampaignRoles(campaignId),
    });

    const { data: commonQuestions } = useQuery({
        queryKey: [`${campaignId}-common-questions`],
        queryFn: () => getAllCommonQuestions(campaignId),
    });

    const { data: rolesAndQuestions } = useQuery({
        queryKey: [`${campaignId}-all-role-questions`, roles],
        queryFn: async () => {
            if (!roles) return [];
            return await Promise.all(roles.map(async (role) => {
                const questions = await getAllRoleQuestions(campaignId, role.id);
                return { role, questions };
            }));
        }
    });

    const [allCommonQuestions, setAllCommonQuestions] = useState<Question[]>(commonQuestions ?? []);
    const [allRoleQuestions, setAllRoleQuestions] = useState<{ role: RoleDetails, questions: Question[] }[]>(rolesAndQuestions ?? []);

    useEffect(() => {
        if (commonQuestions) {
            setAllCommonQuestions(commonQuestions);
        }
        if (rolesAndQuestions) {
            setAllRoleQuestions(rolesAndQuestions);
        }
    }, [commonQuestions, rolesAndQuestions]);

    const [changedQuestions, setChangedQuestions] = useState<Question[]>([]);
    const [newQuestions, setNewQuestions] = useState<Question[]>([]);

    const handleQuestionUpdate = async (action: "update" | "delete", question: Question) => {
        if (action === 'delete') {
            await deleteQuestion(campaignId, question.id);
            await queryClient.invalidateQueries({ queryKey: [`${campaignId}-common-questions`] });
            await queryClient.invalidateQueries({ queryKey: [`${campaignId}-all-role-questions`] })
            return;
        }


        if (newQuestions.some((q) => q.id === question.id)) {
            setNewQuestions(newQuestions.map((q) => q.id === question.id ? question : q));
        } else if (!changedQuestions.some((q) => q.id === question.id)) {
            setChangedQuestions([...changedQuestions, question]);
        } else {
            setChangedQuestions(changedQuestions.map((q) => q.id === question.id ? question : q));
        }

        if (question.common) {
            setAllCommonQuestions(allCommonQuestions.map((q) => q.id === question.id ? question : q));
        } else {
            setAllRoleQuestions(allRoleQuestions.map(({ role, questions }) => { return { role, questions: questions.map((q) => q.id === question.id ? question : q) } }));
        }
    }

    const saveQuestions = async () => {
        await Promise.all(changedQuestions.map(async (question) => {
            await updateQuestion(campaignId, question.id, question);
        }))
        await Promise.all(newQuestions.map(async (question) => {
            await createQuestion(campaignId, question);
        }))

        setChangedQuestions([]);
        setNewQuestions([]);
    }

    const addNewQuestion = (type: QuestionType, roleId: string) => {
        const common = roleId === "common";

        let newQuestion: Question = { id: snowflakeGenerator.generate().toString(), title: "", description: "", roles: [roleId], created_at: new Date().toISOString(), updated_at: new Date().toISOString(), question_type: type, data: { options: [] }, common, required: false };
        if (type === 'ShortAnswer') {
            delete (newQuestion as any).data;
        }

        if (common) {
            newQuestion.roles = [];
            setAllCommonQuestions([...allCommonQuestions, newQuestion]);
        } else {
            setAllRoleQuestions(allRoleQuestions.map(({ role, questions }) => {
                if (role.id === roleId) {
                    return { role, questions: [...questions, newQuestion] };
                }

                return { role, questions };
            }));
        }

        setNewQuestions([...newQuestions, newQuestion]);
    }

    const addExistingQuestion = (questionId: string, roleId: string) => {
        // Common questions cannot be shared with roles
        if (roleId === "common") { return; }
    }

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
                    <div className="flex items-center justify-between">
                        <TabsList>
                            <TabsTrigger value="common">Common</TabsTrigger>
                            {roles?.map((role) => (
                                <TabsTrigger key={role.id} value={role.id}>{role.name}</TabsTrigger>
                            ))}
                        </TabsList>
                        <Button disabled={changedQuestions.length === 0 && newQuestions.length === 0} onClick={saveQuestions}>Save</Button>
                    </div>
                    <TabsContent value="common">
                        <QuestionEditor campaignId={campaignId} questions={allCommonQuestions} handleQuestionUpdate={handleQuestionUpdate} dict={dict} />
                        <NewQuestionButton onAddNew={(type) => addNewQuestion(type, "common")} onAddExisting={(questionId) => { }} disableExisting={true} dict={dict} />
                    </TabsContent>
                    {allRoleQuestions?.map(({ role, questions }) => (
                        <TabsContent key={role.id} value={role.id}>
                            <QuestionEditor campaignId={campaignId} possibleRole={role} questions={questions} handleQuestionUpdate={handleQuestionUpdate} dict={dict} />
                            <NewQuestionButton onAddNew={(type) => addNewQuestion(type, role.id)} onAddExisting={(questionId) => addExistingQuestion(questionId, role.id)} dict={dict} />
                        </TabsContent>
                    ))}
                </Tabs>
            </div>
        </div>
    );
}

function NewQuestionButton({ onAddNew, onAddExisting, disableExisting = false, dict }: { onAddNew: (type: QuestionType) => void, onAddExisting: (questionId: string) => void, disableExisting?: boolean, dict: any }) {
    return (
        <div className="flex justify-center mt-4">
            <Dialog>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost"><Plus className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => onAddNew("ShortAnswer")}>{dict.common.question_types.short_answer}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAddNew("MultiChoice")}>{dict.common.question_types.multi_choice}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAddNew("MultiSelect")}>{dict.common.question_types.multi_select}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAddNew("DropDown")}>{dict.common.question_types.dropdown}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAddNew("Ranking")}>{dict.common.question_types.ranking}</DropdownMenuItem>
                        {!disableExisting && (
                            <>
                                <DropdownMenuSeparator />
                                <DialogTrigger>
                                    <DropdownMenuItem onClick={() => onAddExisting("1")}>{dict.common.question_types.existing_question}</DropdownMenuItem>
                                </DialogTrigger>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>

                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit profile</DialogTitle>
                        <DialogDescription>
                            Make changes to your profile here. Click save when you&apos;re
                            done.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4">
                        <div className="grid gap-3">
                            <Label htmlFor="name-1">Name</Label>
                            <Input id="name-1" name="name" defaultValue="Pedro Duarte" />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="username-1">Username</Label>
                            <Input id="username-1" name="username" defaultValue="@peduarte" />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="submit">Save changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function QuestionEditor({ possibleRole, questions, handleQuestionUpdate, dict }: { campaignId: string, possibleRole?: RoleDetails, questions?: Question[], handleQuestionUpdate: (action: "update" | "delete", question: Question) => Promise<void>, dict: any }) {
    const roleId = possibleRole?.id ?? "common";

    return (
        <div className="flex flex-col gap-2">
            {questions?.map((question) => {
                if (question.question_type !== 'ShortAnswer') {
                    return <MultiOptionQuestionCard key={question.id} question={question} handleQuestionUpdate={handleQuestionUpdate} dict={dict} />
                }
                return <ShortAnswerQuestionCard key={question.id} question={question} handleQuestionUpdate={handleQuestionUpdate} dict={dict} />;
            })}
        </div>
    );
}

function MultiOptionQuestionCard({ question, handleQuestionUpdate, dict }: { question?: Question, handleQuestionUpdate: (action: "update" | "delete", question: Question) => Promise<void>, dict: any }) {
    const [title, setTitle] = useState<string>(question?.title ?? "");
    const [questionType, setQuestionType] = useState<string>(question?.question_type ?? "");
    const [options, setOptions] = useState<MultiOptionQuestionOption[]>(question?.data?.options ?? []);

    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination) {
            return;
        }

        const items = Array.from(options);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        const newItems = items.map((option, index) => ({ ...option, display_order: index + 1 }));

        setOptions(newItems);
        await handleQuestionUpdate('update', { ...question!, data: { options: newItems } });
    }

    const addOption = async (text: string) => {
        // Generate random id for use with DnD and to send to server (which expects i64 - as string or number)
        const newItems: MultiOptionQuestionOption[] = [...options, { id: snowflakeGenerator.generate().toString(), text: text, display_order: options.length + 1 }];
        setOptions(newItems);
        await handleQuestionUpdate('update', { ...question!, data: { options: newItems } });
    }

    const removeOption = async (id: string) => {
        const newItems = options.filter((option) => option.id !== id);
        setOptions(newItems);
        await handleQuestionUpdate('update', { ...question!, data: { options: newItems } });
    }

    const updateOption = async (id: string, text: string) => {
        const newItems = options.map((option) => option.id === id ? { ...option, text: text } : option);
        setOptions(newItems);
        await handleQuestionUpdate('update', { ...question!, data: { options: newItems } });
    }

    const updateTitle = async (title: string) => {
        setTitle(title);
        await handleQuestionUpdate('update', { ...question!, title: title });
    }

    const updateQuestionType = async (questionType: string) => {
        setQuestionType(questionType);
        await handleQuestionUpdate('update', { ...question!, question_type: questionType as QuestionType });
    }

    const handleDeleteQuestion = async () => {
        await handleQuestionUpdate('delete', question!);
    }

    return (
        <div className="flex flex-col p-2 border rounded-md gap-2 w">
            <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                    <Input className="max-w-[500px]" value={title} onChange={async (e) => await updateTitle(e.target.value)} />
                    <Button variant="destructive" onClick={handleDeleteQuestion}><Trash className="w-4 h-4" /></Button>
                </div>
                <Select value={questionType} onValueChange={async (value) => await updateQuestionType(value)}>
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
                                    <Draggable key={option.id} draggableId={option.id} index={option.display_order - 1}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className="p-2 my-1 flex justify-between items-center gap-2"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <GripVertical className="w-4 h-4" />
                                                    <div className="mt-1">
                                                        <OptionDecorator questionType={questionType} index={index} />
                                                    </div>
                                                    <input className="w-full focus:outline-none border-b-2 border-dotted border-gray-500 max-w-[300px]" defaultValue={option.text} onChange={async (e) => await updateOption(option.id, (e.target as HTMLInputElement).value)} />
                                                </div>
                                                <X className="w-5 h-5 cursor-pointer text-red-500 hover:text-red-600" onClick={async () => await removeOption(option.id)} />
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
                        <input className="w-full focus:outline-none border-b-2 border-dotted border-gray-500 max-w-[300px]" placeholder={dict.dashboard.campaigns.questions.add_option} onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                                await addOption((e.target as HTMLInputElement).value);
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

function ShortAnswerQuestionCard({ question, handleQuestionUpdate, dict }: { question?: Question, handleQuestionUpdate: (action: "update" | "delete", question: Question) => Promise<void>, dict: any }) {
    const [title, setTitle] = useState(question?.title ?? "");

    const updateTitle = async (title: string) => {
        setTitle(title);
        await handleQuestionUpdate('update', { ...question!, title: title });
    }

    const handleDeleteQuestion = async () => {
        await handleQuestionUpdate('delete', question!);
    }

    return (
        <div className="flex flex-col justify-between p-2 border rounded-md gap-2 min-h-[120px]">
            <div className="flex justify-between">
                <Input className="max-w-[500px]" value={title} onChange={async (e) => await updateTitle(e.target.value)} />
                <Button variant="destructive" onClick={handleDeleteQuestion}><Trash className="w-4 h-4" /></Button>
            </div>
            <div className="flex flex-col gap-1 p-2">
                <div className="border-b-2 border-dotted border-gray-500 max-w-[300px]">
                    <p className="text-sm text-gray-500">{dict.dashboard.campaigns.questions.answer_text}</p>
                </div>
            </div>
        </div>
    );
}