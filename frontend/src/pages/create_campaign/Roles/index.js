import React, { useState } from "react";
import PropTypes from "prop-types";
import { v4 as uuidv4 } from "uuid";
import AddIcon from "@mui/icons-material/Add";
import {
  ContainerDiv,
  QuestionsDiv,
  RolesDisplay,
  QuestionsDisplay,
  RolesDiv,
  QuestionsHeader,
  SectionTitle,
  RolesListContainer,
  AddQuestionButton,
} from "./rolesTab.styled";
import RoleListItem from "./RoleListItem";
import Question from "./Question";
import SelectFromExistingMenu from "./SelectFromExistingMenu";
import CreateRoleForm from "./CreateRoleForm";

const RolesTab = ({ campaign }) => {
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
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleSelectFromExistingClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseSelectFromExisting = () => {
    setAnchorEl(null);
  };

  const selectFromExisting = (id) => {
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

  const onRoleDelete = (e) => {
    // clicking on a role changes roleSelected to that role. Stop propagation
    // avoids triggering a change in roleSelected to the role being deleted.
    e.stopPropagation();

    const newRoles = roles.filter((r) => r.id !== e.currentTarget.value);

    if (e.currentTarget.value === roleSelected) {
      if (newRoles.length !== 0) {
        setRoleSelected(newRoles[0].id);
      } else {
        setRoleSelected("-1");
      }
    }
    setRoles(newRoles);
  };

  const onQuestionDelete = (e) => {
    // Remove currently selected role from question's roles.
    // If question now relates to no roles, remove from questions.
    setQuestions(
      questions
        .map((q) =>
          q.id !== e.currentTarget.value
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

  const handleQuestionInput = (e, targetQID) => {
    setQuestions(
      questions.map((q) =>
        q.id !== targetQID
          ? q
          : { id: q.id, text: e.currentTarget.value, roles: q.roles }
      )
    );
  };

  const addQuestion = () => {
    if (questions.filter((q) => q.text === "").length) {
      alert(
        "Please add text to existing questions before creating a new question!"
      );
    } else if (roleSelected === "-1") {
      alert(
        "Please create and select one or more roles before adding questions!"
      );
    } else {
      setQuestions([
        ...questions,
        { id: uuidv4(), text: "", roles: new Set([roleSelected]) },
      ]);
    }
  };

  const addRole = () => {
    const newID = uuidv4();
    if (!newRoleName) {
      alert("Role name is required!");
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
      if (roleSelected === "-1") {
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
                idx={idx}
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

RolesTab.propTypes = {
  campaign: PropTypes.shape({
    questions: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        text: PropTypes.string.isRequired,
        roles: PropTypes.objectOf(PropTypes.string).isRequired,
      })
    ).isRequired,
    setQuestions: PropTypes.func.isRequired,
    roles: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        quantity: PropTypes.number.isRequired,
      })
    ).isRequired,
    setRoles: PropTypes.func.isRequired,
    roleSelected: PropTypes.string.isRequired,
    setRoleSelected: PropTypes.func.isRequired,
  }).isRequired,
};

export default RolesTab;
