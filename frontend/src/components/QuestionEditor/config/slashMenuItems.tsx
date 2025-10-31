import React from "react";
import { DefaultReactSuggestionItem } from "@blocknote/react";

export const getQuestionSlashMenuItems = (editor: any): DefaultReactSuggestionItem[] => [
    {
        title: "Multiple Choice Question",
        onItemClick: () => {
            editor.insertBlocks(
                [
                    {
                        type: "mcqQuestion",
                        props: {
                            question: "",
                        },
                    },
                ],
                editor.getTextCursorPosition().block,
                "after"
            );
        },
        aliases: ["mcq", "multiple", "choice", "create"],
        group: "Questions",
        icon: <span>🔘</span>,
        subtext: "Create a multiple choice question with customizable options",
    },
    {
        title: "Text Question",
        onItemClick: () => {
            editor.insertBlocks(
                [
                    {
                        type: "textQuestion",
                        props: {
                            question: "",
                            placeholder: "",
                        },
                    },
                ],
                editor.getTextCursorPosition().block,
                "after"
            );
        },
        aliases: ["text", "input", "short", "create"],
        group: "Questions",
        icon: <span>📝</span>,
        subtext: "Create a text input question",
    },
    {
        title: "Multi-Select Question",
        onItemClick: () => {
            editor.insertBlocks(
                [
                    {
                        type: "multiSelectQuestion",
                        props: {
                            question: "",
                        },
                    },
                ],
                editor.getTextCursorPosition().block,
                "after"
            );
        },
        aliases: ["multiselect", "multi", "select", "checkbox", "create"],
        group: "Questions",
        icon: <span>☑️</span>,
        subtext: "Create a multi-select question with checkboxes",
    },
    {
        title: "Dropdown Question",
        onItemClick: () => {
            editor.insertBlocks(
                [
                    {
                        type: "dropDownQuestion",
                        props: {
                            question: "",
                        },
                    },
                ],
                editor.getTextCursorPosition().block,
                "after"
            );
        },
        aliases: ["dropdown", "select", "options", "create"],
        group: "Questions",
        icon: <span>🔽</span>,
        subtext: "Create a dropdown selection question",
    },
    {
        title: "Ranking Question",
        onItemClick: () => {
            editor.insertBlocks(
                [
                    {
                        type: "rankingQuestion",
                        props: {
                            question: "",
                        },
                    },
                ],
                editor.getTextCursorPosition().block,
                "after"
            );
        },
        aliases: ["ranking", "rank", "order", "priority", "create"],
        group: "Questions",
        icon: <span>🔢</span>,
        subtext: "Create a ranking question with reorderable options",
    },

];
