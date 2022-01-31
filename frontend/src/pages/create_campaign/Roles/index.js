import React, { useState } from "react";
import PropTypes from "prop-types";
import { v4 as uuidv4 } from "uuid";
import {
  ListItemText,
  ListItemIcon,
  IconButton,
  Divider,
  TextField,
  Menu,
  MenuItem,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  ContainerDiv,
  QuestionsDiv,
  RolesDisplay,
  QuestionsDisplay,
  RolesDiv,
  RoleListItem,
  RoleListItemButton,
  QuestionsHeader,
  SectionTitle,
  RolesListContainer,
  RoleQuantity,
  CreateRoleFormControl,
  CreateRoleFormGroup,
  CreateRoleQuantity,
  CreateRoleName,
  AddQuestionButton,
  SelectFromExistingButton,
  QuestionTitle,
  QuestionContent,
} from "./rolesTab.styled";

const RolesTab = (props) => {
  const {
    value,
    index,
    roles,
    setRoles,
    questions,
    setQuestions,
    roleSelected,
    setRoleSelected,
  } = props;
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

  const selectFromExisting = (e) => {
    // add currently selected role to set of roles related to an existing question
    const updatedQuestions = questions.map((q) =>
      q.id === e.currentTarget.value
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
    e.stopPropagation();
    const newRoles = roles.filter((r) => r.id !== e.currentTarget.value);
    if (e.currentTarget.value === roleSelected) {
      if (newRoles.length !== 0) {
        setRoleSelected(newRoles[0].id);
      } else {
        setRoleSelected(-1);
      }
    }
    setRoles(newRoles);
  };

  const onQuestionDelete = (e) => {
    // Remove question from role
    questions.forEach(
      (q) => q.id === e.currentTarget.value && q.roles.delete(roleSelected)
    );
    // If question relates to no roles, remove from questions
    setQuestions(questions.filter((q) => q.roles.size > 0));
  };

  const handleQuestionInput = (e, id) => {
    const newQuestions = questions.map((q) => {
      if (q.id === id) {
        return { id: q.id, text: e.currentTarget.value, roles: q.roles };
      }
      return q;
    });
    setQuestions(newQuestions);
  };

  const addQuestion = () => {
    if (roleSelected === "-1") {
      alert(
        "Please create and select one or more roles before adding questions!"
      );
    } else {
      const newID = uuidv4();
      setQuestions([
        ...questions,
        { id: newID, text: "", roles: new Set([roleSelected]) },
      ]);
    }
  };

  const addRole = () => {
    const newID = uuidv4();
    if (newRoleName) {
      setRoles([
        ...roles,
        {
          id: newID,
          title: newRoleName,
          quantity: newRoleQty,
        },
      ]);
      setNewRoleName("");
      setNewRoleQty(1);
      if (roleSelected === -1) {
        setRoleSelected(newID);
      }
    } else {
      alert("Role name is required!");
    }
  };

  return (
    <div>
      {value.tab === index && (
        <ContainerDiv>
          <RolesDiv>
            <SectionTitle>Roles</SectionTitle>
            <RolesDisplay>
              <RolesListContainer>
                {roles.map((r) => (
                  <>
                    <RoleListItem selected={r.id === roleSelected}>
                      <RoleListItemButton onClick={() => setRoleSelected(r.id)}>
                        <RoleQuantity>{r.quantity}</RoleQuantity>
                        <ListItemText>{r.title}</ListItemText>
                        <ListItemIcon>
                          <IconButton>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </ListItemIcon>
                        <ListItemIcon>
                          <IconButton
                            value={r.id}
                            onClick={(e) => {
                              onRoleDelete(e);
                            }}
                          >
                            <ClearIcon />
                          </IconButton>
                        </ListItemIcon>
                      </RoleListItemButton>
                    </RoleListItem>
                    <Divider />
                  </>
                ))}
              </RolesListContainer>
              <CreateRoleFormControl>
                <CreateRoleFormGroup row>
                  <CreateRoleQuantity
                    type="number"
                    value={newRoleQty}
                    onChange={(e) => setNewRoleQty(e.target.value)}
                    min={1}
                  />
                  <CreateRoleName
                    type="text"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.currentTarget.value)}
                  />
                  <IconButton onClick={addRole}>
                    <AddIcon />
                  </IconButton>
                </CreateRoleFormGroup>
              </CreateRoleFormControl>
            </RolesDisplay>
          </RolesDiv>
          <QuestionsDiv>
            <SectionTitle>Questions</SectionTitle>
            <QuestionsHeader>
              <AddQuestionButton onClick={addQuestion} variant="outlined">
                Add Question
                <AddIcon fontSize="small" />
              </AddQuestionButton>
              <SelectFromExistingButton
                variant="outlined"
                aria-controls={open ? "basic-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={open ? "true" : undefined}
                onClick={handleSelectFromExistingClick}
              >
                Select From Existing
                <ExpandMoreIcon fontSize="small" />
              </SelectFromExistingButton>
              <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleCloseSelectFromExisting}
              >
                {filteredQuestions.length > 0 ? (
                  filteredQuestions.map((q) => (
                    <MenuItem
                      value={q.id}
                      onClick={(e) => selectFromExisting(e)}
                    >
                      {q.text}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem onClick={handleCloseSelectFromExisting}>
                    No existing questions to select from
                  </MenuItem>
                )}
              </Menu>
            </QuestionsHeader>
            <QuestionsDisplay>
              {questions
                .filter((q) => q.roles.has(roleSelected))
                .map((q, idx) => (
                  <>
                    <QuestionTitle>Question {idx + 1}</QuestionTitle>
                    <QuestionContent>
                      <TextField
                        fullWidth
                        multiline
                        required
                        value={q.text}
                        onChange={(e) => {
                          handleQuestionInput(e, q.id);
                        }}
                      />
                      <IconButton
                        value={q.id}
                        onClick={(e) => {
                          onQuestionDelete(e);
                        }}
                      >
                        <ClearIcon />
                      </IconButton>
                    </QuestionContent>
                  </>
                ))}
            </QuestionsDisplay>
          </QuestionsDiv>
        </ContainerDiv>
      )}
    </div>
  );
};

RolesTab.propTypes = {
  value: PropTypes.number.isRequired,
  index: PropTypes.number.isRequired,
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
};

export default RolesTab;
