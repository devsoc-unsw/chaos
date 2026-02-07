"use client";

import { cn } from "@/lib/utils";
import { getCampaign, getCampaignRoles, RoleDetails } from "@/models/campaign";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Asterisk, Check, ChevronsUpDown, GripVertical, Plus, Trash, X } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createQuestion, deleteQuestion, getAllCommonQuestions, getAllRoleQuestions, MultiOptionQuestionOption, Question, QuestionType, updateQuestion } from "@/models/question";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd';
import { snowflakeGenerator } from "@/lib";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"

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

    const { mutateAsync: mutateUpdateQuestion } = useMutation({
        mutationFn: ({ questionId, question }: { questionId: string; question: Question }) =>
            updateQuestion(campaignId, questionId, question),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-common-questions`] });
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-all-role-questions`] });
        },
        onError: () => {
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-common-questions`] });
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-all-role-questions`] });
        },
    });

    const { mutateAsync: mutateDeleteQuestion } = useMutation({
        mutationFn: (questionId: string) => deleteQuestion(campaignId, questionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-common-questions`] });
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-all-role-questions`] });
        },
        onError: () => {
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-common-questions`] });
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-all-role-questions`] });
        },
    });

    const { mutateAsync: mutateCreateQuestion } = useMutation({
        mutationFn: (question: Question) => createQuestion(campaignId, question),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-common-questions`] });
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-all-role-questions`] });
        },
        onError: () => {
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-common-questions`] });
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-all-role-questions`] });
        },
    });

    const handleQuestionUpdate = async (action: "update" | "delete", question: Question) => {
        if (action === 'delete') {
            await mutateDeleteQuestion(question.id);
        } else {
            await mutateUpdateQuestion({ questionId: question.id, question });
        }
    }

    const addNewQuestion = async (type: QuestionType, roleId: string) => {
        const common = roleId === "common";

        let newQuestion: Question = { id: snowflakeGenerator.generate().toString(), title: "", description: "", roles: common ? [] : [roleId], created_at: new Date().toISOString(), updated_at: new Date().toISOString(), question_type: type, data: { options: [{ id: snowflakeGenerator.generate().toString(), display_order: 1, text: "Default Option" }] }, common, required: false };
        if (type === 'ShortAnswer') {
            delete (newQuestion as any).data;
        }

        await mutateCreateQuestion(newQuestion);
    }

    const addExistingQuestion = async (questionId: string, oldRoleId: string, newRoleId: string) => {
        // Common questions cannot be shared with roles
        if (newRoleId === "common" || oldRoleId === "common") { return; }

        const question = rolesAndQuestions
            ?.find(({ role }) => role.id === oldRoleId)
            ?.questions.find((question) => question.id === questionId);

        if (!question) { return; }

        const updatedQuestion = { ...question, roles: [...question.roles, newRoleId] };
        await mutateUpdateQuestion({ questionId: question.id, question: updatedQuestion });
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
                    <TabsList>
                        <TabsTrigger value="common">Common</TabsTrigger>
                        {roles?.map((role) => (
                            <TabsTrigger key={role.id} value={role.id}>{role.name}</TabsTrigger>
                        ))}
                    </TabsList>
                    <TabsContent value="common">
                        <QuestionEditor questions={commonQuestions ?? []} handleQuestionUpdate={handleQuestionUpdate} dict={dict} />
                        <NewQuestionButton currentRole="common" allRoleQuestions={rolesAndQuestions ?? []} onAddNew={(type) => addNewQuestion(type, "common")} onAddExisting={(questionId) => { }} disableExisting={true} dict={dict} />
                    </TabsContent>
                    {rolesAndQuestions?.map(({ role, questions }) => (
                        <TabsContent key={role.id} value={role.id}>
                            <QuestionEditor possibleRole={role} questions={questions} handleQuestionUpdate={handleQuestionUpdate} dict={dict} />
                            <NewQuestionButton currentRole={role.id} allRoleQuestions={rolesAndQuestions ?? []} onAddNew={(type) => addNewQuestion(type, role.id)} onAddExisting={(questionId, oldRoleId) => addExistingQuestion(questionId, oldRoleId, role.id)} dict={dict} />
                        </TabsContent>
                    ))}
                </Tabs>
            </div>
        </div>
    );
}

function NewQuestionButton({ currentRole, allRoleQuestions, onAddNew, onAddExisting, disableExisting = false, dict }: { currentRole: string, allRoleQuestions: { role: RoleDetails, questions: Question[] }[], onAddNew: (type: QuestionType) => void, onAddExisting: (questionId: string, oldRoleId: string) => void, disableExisting?: boolean, dict: any }) {
    const [questionId, setQuestionId] = useState<string>("");
    const [oldRoleId, setOldRoleId] = useState<string>("");

    return (
        <div className="flex justify-center mt-4">
            <AlertDialog>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost"><Plus className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[300px]">
                        <DropdownMenuItem onClick={() => onAddNew("ShortAnswer")}>{dict.common.question_types.short_answer}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAddNew("MultiChoice")}>{dict.common.question_types.multi_choice}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAddNew("MultiSelect")}>{dict.common.question_types.multi_select}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAddNew("DropDown")}>{dict.common.question_types.dropdown}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAddNew("Ranking")}>{dict.common.question_types.ranking}</DropdownMenuItem>
                        {!disableExisting && (
                            <>
                                <DropdownMenuSeparator />
                                <AlertDialogTrigger>
                                    <DropdownMenuItem>{dict.common.question_types.existing_questions}</DropdownMenuItem>
                                </AlertDialogTrigger>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>

                <AlertDialogContent className="sm:max-w-[800px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{dict.common.question_types.existing_questions}</AlertDialogTitle>
                    </AlertDialogHeader>
                    <div>
                        <ExistingQuestionsCombobox
                            // Filter out questions that are already assigned to the current role
                            allRoleQuestions={
                                allRoleQuestions
                                    .filter(({ role }) => role.id !== currentRole)
                                    .map(({ role, questions }) => (
                                        {
                                            role,
                                            questions: questions.filter((question) => !question.roles.includes(currentRole))
                                        }
                                    ))
                                    .filter(({ questions }) => questions.length > 0)
                            } setQuestion={setQuestionId} setOldRoleId={setOldRoleId} />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel asChild>
                            <Button variant="outline">{dict.dashboard.actions.cancel}</Button>
                        </AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <Button disabled={!questionId} onClick={() => onAddExisting(questionId, oldRoleId)} type="submit">{dict.dashboard.actions.add}</Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}


function ExistingQuestionsCombobox({ allRoleQuestions, setQuestion, setOldRoleId }: { allRoleQuestions: { role: RoleDetails, questions: Question[] }[], setQuestion: (questionId: string) => void, setOldRoleId: (oldRoleId: string) => void }) {
    const [open, setOpen] = useState(false)
    const [value, setValue] = useState("")

    const handleSetValue = (value: string, oldRoleId: string) => {
        setValue(value);
        setQuestion(value);
        setOldRoleId(oldRoleId);
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[700px] justify-between"
                >
                    {value
                        ? allRoleQuestions.find(({ questions }) => questions.find((question) => question.id === value))?.questions.find((question) => question.id === value)?.title
                        : "Select question..."}
                    <ChevronsUpDown className="opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[700px] p-0">
                <Command>
                    <CommandInput placeholder="Search questions..." className="h-9" />
                    <CommandList>
                        <CommandEmpty>No question found.</CommandEmpty>
                        {allRoleQuestions.map(({ role, questions }) => (
                            <CommandGroup key={role.id} heading={role.name}>
                                {questions.map((question) => (
                                    <CommandItem
                                        key={`${role.id}-${question.id}`}
                                        value={question.title}
                                        onSelect={(currentValue) => {
                                            handleSetValue(currentValue === questions.find((question) => question.id === value)?.title ? "" : question.id, role.id)
                                            setOpen(false)
                                        }}
                                    >
                                        {question.title}
                                        <Check
                                            className={cn(
                                                "ml-auto",
                                                value === question.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        ))}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

function QuestionEditor({ possibleRole, questions, handleQuestionUpdate, dict }: { possibleRole?: RoleDetails, questions?: Question[], handleQuestionUpdate: (action: "update" | "delete", question: Question) => Promise<void>, dict: any }) {
    const roleId = possibleRole?.id ?? "common";

    return (
        <div className="flex flex-col gap-2">
            {questions?.map((question) => {
                if (question.question_type !== 'ShortAnswer') {
                    return <MultiOptionQuestionCard key={question.id} question={question} currentRole={roleId} possibleRole={possibleRole} handleQuestionUpdate={handleQuestionUpdate} dict={dict} />
                }
                return <ShortAnswerQuestionCard key={question.id} question={question} currentRole={roleId} possibleRole={possibleRole} handleQuestionUpdate={handleQuestionUpdate} dict={dict} />;
            })}
        </div>
    );
}

function MultiOptionQuestionCard({ question, currentRole, possibleRole, handleQuestionUpdate, dict }: { question?: Question, currentRole: string, possibleRole?: RoleDetails, handleQuestionUpdate: (action: "update" | "delete", question: Question) => Promise<void>, dict: any }) {
    const [title, setTitle] = useState<string>(question?.title ?? "");
    const [questionType, setQuestionType] = useState<string>(question?.question_type ?? "");
    const [options, setOptions] = useState<MultiOptionQuestionOption[]>(question?.data?.options ?? []);
    const [required, setRequired] = useState<boolean>(question?.required ?? false);

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

    const handleRemoveQuestionFromRole = async () => {
        const updatedQuestion = { ...question!, roles: question?.roles?.filter((role) => role !== currentRole) ?? [] };
        await handleQuestionUpdate('update', updatedQuestion);
    }

    const toggleRequired = async () => {
        const newRequired = !required;
        setRequired(newRequired);
        await handleQuestionUpdate('update', { ...question!, required: newRequired });
    }

    return (
        <div className="flex flex-col p-2 border rounded-md gap-2 w">
            <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                    <Input className="max-w-[500px]" value={title} onChange={async (e) => await updateTitle(e.target.value)} />
                    <div className="flex items-center gap-1">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant={required ? "default" : "outline"} onClick={toggleRequired}>
                                    <Asterisk className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{required ? "Required" : "Optional"}</p>
                            </TooltipContent>
                        </Tooltip>
                        {
                            question?.roles && question?.roles.length > 1 && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" onClick={handleRemoveQuestionFromRole}>
                                            <X className="w-8 h-8" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Remove question from this role</p>
                                    </TooltipContent>
                                </Tooltip>
                            )
                        }
                        <Button variant="destructive" onClick={handleDeleteQuestion}><Trash className="w-4 h-4" /></Button>
                    </div>
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

function ShortAnswerQuestionCard({ question, currentRole, possibleRole, handleQuestionUpdate, dict }: { question?: Question, currentRole: string, possibleRole?: RoleDetails, handleQuestionUpdate: (action: "update" | "delete", question: Question) => Promise<void>, dict: any }) {
    const [title, setTitle] = useState(question?.title ?? "");
    const [required, setRequired] = useState(question?.required ?? false);

    const updateTitle = async (title: string) => {
        setTitle(title);
        await handleQuestionUpdate('update', { ...question!, title: title });
    }

    const handleDeleteQuestion = async () => {
        await handleQuestionUpdate('delete', question!);
    }

    const handleRemoveQuestionFromRole = async () => {
        const updatedQuestion = { ...question!, roles: question?.roles?.filter((role) => role !== currentRole) ?? [] };
        await handleQuestionUpdate('update', updatedQuestion);
    }

    const toggleRequired = async () => {
        const newRequired = !required;
        setRequired(newRequired);
        await handleQuestionUpdate('update', { ...question!, required: newRequired });
    }

    return (
        <div className="flex flex-col justify-between p-2 border rounded-md gap-2 min-h-[120px]">
            <div className="flex justify-between">
                <Input className="max-w-[500px]" value={title} onChange={async (e) => await updateTitle(e.target.value)} />
                <div className="flex items-center gap-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant={required ? "default" : "outline"} onClick={toggleRequired}>
                                <Asterisk className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{required ? "Required" : "Optional"}</p>
                        </TooltipContent>
                    </Tooltip>
                {
                    question?.roles && question?.roles.length > 1 && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" onClick={handleRemoveQuestionFromRole}>
                                    <X className="w-8 h-8" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Remove question from this role</p>
                            </TooltipContent>
                        </Tooltip>
                    )
                }
                <Button variant="destructive" onClick={handleDeleteQuestion}><Trash className="w-4 h-4" /></Button>
                </div>
            </div>
            <div className="flex flex-col gap-1 p-2">
                <div className="border-b-2 border-dotted border-gray-500 max-w-[300px]">
                    <p className="text-sm text-gray-500">{dict.dashboard.campaigns.questions.answer_text}</p>
                </div>
            </div>
        </div>
    );
}