import { Tab, Tabs } from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import QuestionEditor from "components/QuestionEditor/QuestionEditor";
import { createQuestion, updateQuestion, deleteQuestion, getCampaignRoles, getCommonQuestions, getRoleQuestions } from "api";
import { pushToast } from "utils";
import type { Block, BlockNoteEditor, PartialBlock } from "@blocknote/core";
import type { Role, QuestionResponse } from "types/api";

type Props = {
  campaignId: string;
};

const QuestionsTab = ({ campaignId }: Props) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [isCommon, setIsCommon] = useState(true);
  const [documentsByTab, setDocumentsByTab] = useState<Record<string, PartialBlock[]>>({});
  const [documentVersions, setDocumentVersions] = useState<Record<string, number>>({});
  const editorRef = useRef<BlockNoteEditor<any, any, any> | null>(null);
  const [isLoadingTab, setIsLoadingTab] = useState(false);
  const getTabKey = useCallback(
    (roleId: string | null, common: boolean) => (common || roleId === null ? "common" : roleId),
    []
  );
  const loadedTabsRef = useRef<Set<string>>(new Set());
  const previousTabKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const data = await getCampaignRoles(campaignId);
        setRoles(data);
      } catch (error) {
        console.error("Failed to load roles:", error);
      }
    };
    void loadRoles();
  }, [campaignId]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    const currentKey = getTabKey(selectedRoleId, isCommon);

    // Save current editor state before switching tabs
    if (editorRef.current) {
      const currentDocument = JSON.parse(JSON.stringify(editorRef.current.document)) as PartialBlock[];
      setDocumentsByTab((prev) => ({
        ...prev,
        [currentKey]: currentDocument,
      }));
    }

    // Determine new tab state
    let newRoleId: string | null = null;
    let newIsCommon = true;
    
    if (newValue === 0) {
      newRoleId = null;
      newIsCommon = true;
    } else {
      const role = roles[newValue - 1];
      if (!role) {
        return;
      }
      newRoleId = role.id;
      newIsCommon = false;
    }

    // Update state
    setSelectedRoleId(newRoleId);
    setIsCommon(newIsCommon);

    // Load questions for the new tab (will be triggered by useEffect when currentTabKey changes)
  };

  const currentTabKey = useMemo(
    () => getTabKey(selectedRoleId, isCommon),
    [getTabKey, isCommon, selectedRoleId]
  );

  const questionToBlock = useCallback((question: QuestionResponse): PartialBlock | null => {
    try {
      const description = question.description ?? "";
      // Safely get question_type, handling both enum and string formats
      const questionType = question.question_type 
        ? (typeof question.question_type === 'string' 
            ? question.question_type 
            : String(question.question_type))
        : "";

      if (!questionType) {
        console.warn("Question missing question_type:", question);
        return null;
      }

      if (questionType === "ShortAnswer") {
        return {
          id: question.id,
          type: "textQuestion",
          props: {
            question: question.title,
            description,
            placeholder: "",
            questionId: question.id,
            originalCommon: question.common,
            originalRoles: JSON.stringify(question.roles),
          },
        } as PartialBlock;
      }

      const options = question.data?.options ?? [];
      const serializedOptions = JSON.stringify(
        options.length > 0
          ? options.map((option) => ({ text: option.text, correct: false }))
          : [{ text: "Option 1", correct: false }]
      );

      if (questionType === "MultiChoice") {
        return {
          id: question.id,
          type: "mcqQuestion",
          props: {
            question: question.title,
            description,
            options: serializedOptions,
            questionId: question.id,
            originalCommon: question.common,
            originalRoles: JSON.stringify(question.roles),
          },
        } as PartialBlock;
      }

      if (questionType === "MultiSelect") {
        return {
          id: question.id,
          type: "multiSelectQuestion",
          props: {
            question: question.title,
            description,
            options: serializedOptions,
            questionId: question.id,
            originalCommon: question.common,
            originalRoles: JSON.stringify(question.roles),
          },
        } as PartialBlock;
      }

      if (questionType === "DropDown") {
        return {
          id: question.id,
          type: "dropDownQuestion",
          props: {
            question: question.title,
            description,
            options: serializedOptions,
            questionId: question.id,
            originalCommon: question.common,
            originalRoles: JSON.stringify(question.roles),
          },
        } as PartialBlock;
      }

      if (questionType === "Ranking") {
        return {
          id: question.id,
          type: "rankingQuestion",
          props: {
            question: question.title,
            description,
            options: serializedOptions,
            questionId: question.id,
            originalCommon: question.common,
            originalRoles: JSON.stringify(question.roles),
          },
        } as PartialBlock;
      }

      console.warn("Unknown question type:", questionType, question);
      return null;
    } catch (error) {
      console.error("Error converting question to block:", error, question);
      return null;
    }
  }, []);

  const buildBlocksFromQuestions = useCallback(
    (questionList: QuestionResponse[]): PartialBlock[] => {
      const blocks = questionList
        .map((question) => questionToBlock(question))
        .filter((block): block is PartialBlock => block !== null);
      if (blocks.length === 0) {
        return blocks;
      }

      return [
        ...blocks,
        {
          id: `paragraph-${Date.now()}-${Math.random()}`,
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "",
              styles: {},
            },
          ],
        } as PartialBlock,
      ];
    },
    [questionToBlock]
  );

  const fetchQuestionsForTab = useCallback(
    async (common: boolean, roleId: string | null): Promise<PartialBlock[]> => {
      try {
        let questions: QuestionResponse[] = [];
        
        if (common) {
          questions = await getCommonQuestions(campaignId);
          console.log(`Loaded ${questions.length} common questions:`, questions);
        } else if (roleId) {
          questions = await getRoleQuestions(campaignId, roleId);
          console.log(`Loaded ${questions.length} questions for role ${roleId}:`, questions);
        }

        if (questions.length === 0) {
          console.log("No questions found for", common ? "common" : `role ${roleId}`);
          return [];
        }

        const blocks = buildBlocksFromQuestions(questions);
        console.log(`Converted ${questions.length} questions to ${blocks.length} blocks`);
        return blocks;
      } catch (error) {
        console.error("Failed to load questions:", error);
        pushToast("Questions", "Failed to load questions", "error");
        return [];
      }
    },
    [buildBlocksFromQuestions, campaignId]
  );

  const ensureTabContent = useCallback(
    async (tabKey: string, common: boolean, roleId: string | null, force = false) => {
      // Check if we're switching tabs (tabKey changed)
      const isTabSwitch = previousTabKeyRef.current !== null && previousTabKeyRef.current !== tabKey;
      
      // Always reload when switching tabs or forcing reload
      // Only use cache if we're not switching tabs and not forcing
      if (!force && !isTabSwitch && documentsByTab[tabKey]) {
        setDocumentVersions((prev) => ({
          ...prev,
          [tabKey]: (prev[tabKey] ?? 0) + 1,
        }));
        loadedTabsRef.current.add(tabKey);
        previousTabKeyRef.current = tabKey;
        return;
      }

      // Fetch questions from server
      setIsLoadingTab(true);
      try {
        const blocks = await fetchQuestionsForTab(common, roleId);
        
        setDocumentsByTab((prev) => ({
          ...prev,
          [tabKey]: blocks,
        }));

        setDocumentVersions((prev) => ({
          ...prev,
          [tabKey]: (prev[tabKey] ?? 0) + 1,
        }));

        loadedTabsRef.current.add(tabKey);
        previousTabKeyRef.current = tabKey;
      } catch (error) {
        console.error("Failed to ensure tab content:", error);
        // Set empty array on error so editor still loads
        setDocumentsByTab((prev) => ({
          ...prev,
          [tabKey]: [],
        }));
        setDocumentVersions((prev) => ({
          ...prev,
          [tabKey]: (prev[tabKey] ?? 0) + 1,
        }));
        previousTabKeyRef.current = tabKey;
      } finally {
        setIsLoadingTab(false);
      }
    },
    [documentsByTab, fetchQuestionsForTab]
  );

  useEffect(() => {
    void ensureTabContent(currentTabKey, isCommon, selectedRoleId);
  }, [currentTabKey, ensureTabContent, isCommon, selectedRoleId]);

  // Convert BlockNote block to backend format
  const convertBlockToQuestion = useCallback((block: Block): any | null => {
    const { type, props } = block;
    
    // For existing questions, use their original common/roles status
    // For new questions, use the current tab's status
    const questionId = props.questionId as string | undefined;
    const isExistingQuestion = !!questionId;
    
    let questionCommon: boolean;
    let roleIdArray: string[] | null = null;
    
    if (isExistingQuestion) {
      // Use original question's status
      questionCommon = (props.originalCommon as boolean | undefined) ?? isCommon;
      let originalRoles: string[] = [];
      try {
        const rolesProp = props.originalRoles as string | undefined;
        if (rolesProp) {
          originalRoles = typeof rolesProp === 'string' ? JSON.parse(rolesProp) : rolesProp;
        }
      } catch (e) {
        console.error("Failed to parse originalRoles:", e);
      }
      
      if (!questionCommon) {
        // Remove duplicates and ensure it's an array of strings
        // Backend requires Some(Vec<i64>) when common is false - it uses .expect() which will panic if None
        const uniqueRoles = [...new Set(originalRoles)].filter(Boolean);
        if (uniqueRoles.length === 0) {
          // If question is not common but has no roles, this is invalid
          // Use current tab's role as fallback
          if (selectedRoleId) {
            roleIdArray = [selectedRoleId];
          } else {
            console.error("Cannot update non-common question without roles");
            return null;
          }
        } else {
          roleIdArray = uniqueRoles;
        }
      }
    } else {
      // Use current tab's status for new questions
      questionCommon = isCommon;
      if (!isCommon) {
        if (!selectedRoleId) {
          console.error("Cannot create role-specific question without selectedRoleId");
          return null;
        }
        roleIdArray = [selectedRoleId];
      }
    }
    
    // Helper function to build question object with conditional roles field
    const buildQuestionData = (questionType: string, data: any) => {
      const base: any = {
        title: props.question || "",
        description: props.description || undefined,
        common: questionCommon,
        required: true,
        question_type: questionType,
      };
      
      // Only include data field for multi-option question types
      // ShortAnswer doesn't have a data field
      if (data !== null && data !== undefined) {
        base.data = data;
      }
      
      // Include roles field: null for common questions, array for role-specific
      // Backend expects Option<Vec<i64>>, so null is valid
      base.roles = roleIdArray;
      
      // Log roles for debugging
      if (isExistingQuestion) {
        console.log("Updating question - roles:", roleIdArray, "common:", questionCommon);
      }
      
      return base;
    };

    if (type === "textQuestion") {
      return buildQuestionData("ShortAnswer", null);
    }

    if (type === "mcqQuestion") {
      const options = JSON.parse(props.options || JSON.stringify([{ text: "Option 1", correct: false }]));
      const validOptions = options
        .filter((opt: any) => opt.text && opt.text.trim() !== "")
        .map((opt: any, idx: number) => ({
          id: 0, // Backend will generate actual IDs
          display_order: idx + 1,
          text: opt.text.trim(),
        }));
      
      if (validOptions.length === 0) {
        return null; // Need at least one option
      }
      
      return buildQuestionData("MultiChoice", { options: validOptions });
    }

    if (type === "multiSelectQuestion") {
      const options = JSON.parse(props.options || JSON.stringify([{ text: "Option 1", correct: false }]));
      const validOptions = options
        .filter((opt: any) => opt.text && opt.text.trim() !== "")
        .map((opt: any, idx: number) => ({
          id: 0, // Backend will generate actual IDs
          display_order: idx + 1,
          text: opt.text.trim(),
        }));
      
      if (validOptions.length === 0) {
        return null; // Need at least one option
      }
      
      return buildQuestionData("MultiSelect", { options: validOptions });
    }

    if (type === "dropDownQuestion") {
      const options = JSON.parse(props.options || JSON.stringify([{ text: "Option 1", correct: false }]));
      const validOptions = options
        .filter((opt: any) => opt.text && opt.text.trim() !== "")
        .map((opt: any, idx: number) => ({
          id: 0, // Backend will generate actual IDs
          display_order: idx + 1,
          text: opt.text.trim(),
        }));
      
      if (validOptions.length === 0) {
        return null; // Need at least one option
      }
      
      return buildQuestionData("DropDown", { options: validOptions });
    }

    if (type === "rankingQuestion") {
      const options = JSON.parse(props.options || JSON.stringify([{ text: "Option 1", correct: false }]));
      const validOptions = options
        .filter((opt: any) => opt.text && opt.text.trim() !== "")
        .map((opt: any, idx: number) => ({
          id: 0, // Backend will generate actual IDs
          display_order: idx + 1,
          text: opt.text.trim(),
        }));
      
      if (validOptions.length === 0) {
        return null; // Need at least one option
      }
      
      return buildQuestionData("Ranking", { options: validOptions });
    }

    return null;
  }, [isCommon, selectedRoleId]);

  const handleSaveQuestion = useCallback(async (block: Block) => {
    // Validate state
    if (!isCommon && !selectedRoleId) {
      pushToast("Error", "Please select a role before creating role-specific questions.", "error");
      return;
    }

    // Check if this is a question block
    if (!["textQuestion", "mcqQuestion", "multiSelectQuestion", "dropDownQuestion", "rankingQuestion"].includes(block.type)) {
      pushToast("Error", "Invalid question type", "error");
      return;
    }

    const questionData = convertBlockToQuestion(block);
    
    if (!questionData) {
      pushToast("Error", "Failed to convert question. Please ensure all required fields are filled.", "error");
      return;
    }
    
    if (!questionData.title || !questionData.title.trim()) {
      pushToast("Error", "Question title is required", "error");
      return;
    }

    // Validate that multi-option questions have at least one option
    // Skip validation for ShortAnswer questions (they don't have options)
    const multiOptionTypes = ["MultiChoice", "MultiSelect", "DropDown", "Ranking"];
    if (multiOptionTypes.includes(questionData.question_type)) {
      if (questionData.data && questionData.data.options && questionData.data.options.length === 0) {
        pushToast("Error", "Please add at least one option for this question type", "error");
        return;
      }
    }

    const questionId = block.props.questionId as string | undefined;
    const isUpdate = !!questionId;

    try {
      if (isUpdate) {
        // Update existing question
        console.log("Updating question with data:", JSON.stringify(questionData, null, 2));
        await updateQuestion(campaignId, questionId, questionData);
        pushToast("Success", "Question updated successfully", "success");
        // Reload questions to reflect changes
        await ensureTabContent(currentTabKey, isCommon, selectedRoleId, true);
      } else {
        // Create new question
        const response = await createQuestion(campaignId, questionData);
        // Update the block with the new question ID
        // Note: We need to get the question ID from the response
        // For now, we'll reload the questions to get the updated block
        pushToast("Success", "Question created successfully", "success");
        await ensureTabContent(currentTabKey, isCommon, selectedRoleId, true);
      }
    } catch (error: any) {
      console.error(`Failed to ${isUpdate ? "update" : "create"} question:`, error);
      console.error("Question data sent:", JSON.stringify(questionData, null, 2));
      let errorMessage = `Failed to ${isUpdate ? "update" : "create"} question`;
      
      // Try to extract more detailed error message
      console.error("Error object keys:", Object.keys(error));
      console.error("Error.data:", error.data);
      console.error("Error.resp:", error.resp);
      
      if (error.data) {
        // Error data is already parsed by FetchError
        console.error("Error data type:", typeof error.data);
        console.error("Error data value:", error.data);
        if (typeof error.data === 'object') {
          if (error.data.message) {
            errorMessage = error.data.message;
          } else if (error.data.error) {
            errorMessage = error.data.error;
          } else if (error.data.detail) {
            errorMessage = error.data.detail;
          } else {
            // Try to stringify the whole error data object
            errorMessage = JSON.stringify(error.data);
          }
        } else if (typeof error.data === 'string') {
          errorMessage = error.data;
        }
      } else if (error.resp) {
        // Try to get error text from response if data wasn't parsed
        try {
          // Response might already be consumed, but let's try
          const errorText = error.resp.statusText || String(error.resp.status);
          console.error("Error response status:", error.resp.status, errorText);
          errorMessage = `HTTP ${error.resp.status}: ${errorText}`;
        } catch (e) {
          console.error("Could not get error from response:", e);
        }
      }
      
      pushToast("Error", errorMessage, "error");
      throw error;
    }
  }, [campaignId, convertBlockToQuestion, currentTabKey, ensureTabContent, isCommon, selectedRoleId]);

  const handleDeleteQuestion = useCallback(async (block: Block) => {
    const questionId = block.props.questionId as string | undefined;
    
    if (!questionId) {
      pushToast("Error", "Cannot delete question: question ID not found", "error");
      return;
    }

    // Confirm deletion
    if (!window.confirm("Are you sure you want to delete this question? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteQuestion(campaignId, questionId);
      pushToast("Success", "Question deleted successfully", "success");
      
      // Remove the block from the editor
      if (editorRef.current) {
        editorRef.current.removeBlocks([block]);
      }
      
      // Reload questions to reflect the deletion
      await ensureTabContent(currentTabKey, isCommon, selectedRoleId, true);
    } catch (error: any) {
      console.error("Failed to delete question:", error);
      let errorMessage = "Failed to delete question";
      
      if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error.resp) {
        errorMessage = `HTTP ${error.resp.status}: ${error.resp.statusText}`;
      }
      
      pushToast("Error", errorMessage, "error");
    }
  }, [campaignId, currentTabKey, ensureTabContent, isCommon, selectedRoleId]);

  const initialBlocks = documentsByTab[currentTabKey];
  const documentKey = `${currentTabKey}:${documentVersions[currentTabKey] ?? 0}`;

  return (
    <div style={{ width: "100%" }}>
      <Tabs
        value={selectedRoleId === null ? 0 : roles.findIndex((r) => r.id === selectedRoleId) + 1}
        onChange={handleTabChange}
        textColor="primary"
        indicatorColor="primary"
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          marginBottom: "30px",
        }}
      >
        <Tab
          label="General"
          sx={{
            textTransform: "uppercase",
            fontWeight: selectedRoleId === null ? 600 : 400,
            color: selectedRoleId === null ? "primary.main" : "text.secondary",
          }}
        />
        {roles.map((role) => (
          <Tab
            key={role.id}
            label={role.name}
            sx={{
              textTransform: "uppercase",
              fontWeight: selectedRoleId === role.id ? 600 : 400,
              color: selectedRoleId === role.id ? "primary.main" : "text.secondary",
            }}
          />
        ))}
      </Tabs>

      {isLoadingTab && (
        <div style={{ marginBottom: "12px", color: "#6b7280" }}>Loading questions…</div>
      )}

      <div style={{ minHeight: "500px" }}>
        <QuestionEditor
          campaignId={campaignId}
          roleId={selectedRoleId}
          isCommon={isCommon}
          onSaveQuestion={handleSaveQuestion}
          onDeleteQuestion={handleDeleteQuestion}
          initialBlocks={initialBlocks}
          documentKey={documentKey}
          onEditorReady={(editor) => {
            editorRef.current = editor;
          }}
        />
      </div>
    </div>
  );
};

export default QuestionsTab;

