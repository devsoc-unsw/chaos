import AddIcon from "@mui/icons-material/Add";
import { useState } from "react";

import CreateRoleForm from "./CreateRoleForm";
import Question from "./Question";
import RoleListItem from "./RoleListItem";
import SelectFromExistingMenu from "./SelectFromExistingMenu";
import {
  AddQuestionButton,
  ContainerDiv,
  QuestionsDisplay,
  QuestionsDiv,
  QuestionsHeader,
  RolesDisplay,
  RolesDiv,
  RolesListContainer,
  SectionTitle,
} from "./rolesTab.styled";

import type { Campaign } from "../types";
import type { ChangeEvent, MouseEvent } from "react";

type Props = {
  campaign: Campaign;
};
const RolesTab = ({ campaign }: Props) => {
  const {
    roles,
    setRoles,
    questions,
    setQuestions,
    roleSelected,
    setRoleSelected,
  } = campaign;
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleQty, setNewRoleQty] = useState(1);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleSelectFromExistingClick = (
    event: MouseEvent<HTMLButtonElement>
  ) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseSelectFromExisting = () => {
    setAnchorEl(null);
  };

  const selectFromExisting = (id: number) => {
    // add currently selected role to set of roles related to an existing question
    const updatedQuestions = questions.map((q) =>
      q.id === id
        ? { id: q.id, text: q.text, roles: q.roles.add(roleSelected) }
        : q
    );
    setQuestions(updatedQuestions);
    handleCloseSelectFromExisting();
  };

  // filter for questions pertaining to currently selected role
  const filteredQuestions = questions.filter(
    (q) => !q.roles.has(roleSelected) && q.text !== ""
  );

  const onRoleDelete = (e: MouseEvent<HTMLButtonElement>) => {
    // clicking on a role changes roleSelected to that role. Stop propagation
    // avoids triggering a change in roleSelected to the role being deleted.
    e.stopPropagation();

    const toDelete = Number(e.currentTarget.value);

    const newRoles = roles.filter((r) => r.id !== toDelete);
    console.log(e.currentTarget.value);

    if (toDelete === roleSelected) {
      if (newRoles.length !== 0) {
        setRoleSelected(newRoles[0].id);
      } else {
        setRoleSelected(-1);
      }
    }
    setRoles(newRoles);
  };

  const onQuestionDelete = (e: MouseEvent<HTMLButtonElement>) => {
    // Remove currently selected role from question's roles.
    // If question now relates to no roles, remove from questions.
    setQuestions(
      questions
        .map((q) =>
          q.id !== Number(e.currentTarget.value)
            ? q
            : {
                id: q.id,
                text: q.text,
                roles: new Set([...q.roles].filter((r) => r !== roleSelected)),
              }
        )
        .filter((q) => q.roles.size > 0)
    );
  };

  const handleQuestionInput = (
    e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
    targetQID: number
  ) => {
    setQuestions(
      questions.map((q) =>
        q.id !== targetQID
          ? q
          : { id: q.id, text: e.currentTarget.value, roles: q.roles }
      )
    );
  };

  const addQuestion = () => {
    if (questions.some((q) => q.text === "")) {
      console.error(
        "Please add text to existing questions before creating a new question!"
      );
    } else if (roleSelected === -1) {
      console.error(
        "Please create and select one or more roles before adding questions!"
      );
    } else {
      setQuestions([
        ...questions,
        {
          id: Math.max(0, ...Object.values(questions).map((q) => q.id)) + 1,
          text: "",
          roles: new Set([roleSelected]),
        },
      ]);
    }
  };

  const addRole = () => {
    const newID = Math.max(0, ...Object.values(roles).map((r) => r.id)) + 1;
    if (!newRoleName) {
      console.error("Role name is required!");
    } else {
      setRoles([
        ...roles,
        {
          id: newID,
          title: newRoleName,
          quantity: newRoleQty,
        },
      ]);
      // if no role is selected, set roleSelected to new role
      if (roleSelected === -1) {
        setRoleSelected(newID);
      }
      setNewRoleName("");
      setNewRoleQty(1);
    }
  };

  return (
    <ContainerDiv>
      <RolesDiv>
        <SectionTitle>Roles</SectionTitle>
        <RolesDisplay>
          <RolesListContainer>
            {roles.map((r) => (
              <RoleListItem
                role={r}
                roleSelected={roleSelected}
                setRoleSelected={setRoleSelected}
                onRoleDelete={onRoleDelete}
              />
            ))}
          </RolesListContainer>
          <CreateRoleForm
            newRoleQty={newRoleQty}
            setNewRoleQty={setNewRoleQty}
            newRoleName={newRoleName}
            setNewRoleName={setNewRoleName}
            addRole={addRole}
          />
        </RolesDisplay>
      </RolesDiv>
      <QuestionsDiv>
        <SectionTitle>Questions</SectionTitle>
        <QuestionsHeader>
          <AddQuestionButton onClick={addQuestion} variant="outlined">
            Add Question
            <AddIcon fontSize="small" />
          </AddQuestionButton>
          <SelectFromExistingMenu
            filteredQuestions={filteredQuestions}
            selectFromExisting={selectFromExisting}
            open={open}
            handleSelectFromExistingClick={handleSelectFromExistingClick}
            handleCloseSelectFromExisting={handleCloseSelectFromExisting}
            anchorEl={anchorEl}
          />
        </QuestionsHeader>
        <QuestionsDisplay>
          {questions
            .filter((q) => q.roles.has(roleSelected))
            .map((q, idx) => (
              <Question
                questionNumber={idx + 1}
                question={q}
                handleQuestionInput={handleQuestionInput}
                onQuestionDelete={onQuestionDelete}
              />
            ))}
        </QuestionsDisplay>
      </QuestionsDiv>
    </ContainerDiv>
  );
};

export default RolesTab;
