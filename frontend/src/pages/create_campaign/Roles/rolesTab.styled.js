import { styled } from "@mui/material/styles";
import {
  ListItem,
  ListItemText,
  ListItemButton,
  FormControl,
  FormGroup,
  Button,
} from "@mui/material";

export const ContainerDiv = styled("div")`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
`;

export const RolesDiv = styled("div")`
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 600px;
  width: 40%;
  min-width: 400px;
  float: left;
`;

export const SectionTitle = styled("h2")`
  margin-top: 0px;
`;

export const RolesDisplay = styled("div")`
  position: relative;
  overflow: hidden;
  width: 90%;
  height: 600px;
  border-style: solid;
  border-width: 1px;
  border-color: grey;
  border-radius: 12px;
`;

export const RoleQuantity = styled(ListItemText)`
  padding-left: 50px;
`;

export const RolesListContainer = styled("div")`
  height: 472px;
  position: relative;
  overflow: scroll;
`;

export const RoleListItemContent = styled(ListItem)`
  padding: 0px;
  height: 70px;
`;

export const RoleListItemButton = styled(ListItemButton)`
  padding: 0%;
  height: 100%;
`;

export const CreateRoleFormControl = styled(FormControl)`
  width: 100%;
  position: absolute;
  bottom: 0;
  left: 0;
  border-top: solid;
  border-width: 1px;
  border-clor: grey;
`;

export const CreateRoleFormGroup = styled(FormGroup)`
  justify-content: space-around;
  align-items: center;
  height: 70px;
`;

export const CreateRoleQuantity = styled("input")`
  width: 12%;
  height: 50px;
  border-width: 1px;
  padding-left: 5px;
  font-size: 20px;
  border-radius: 12px;
`;

export const CreateRoleName = styled("input")`
  width: 65%;
  height: 50px;
  padding-left: 5px;
  font-size: 20px;
  border-width: 1px;
  border-radius: 12px;
`;

export const QuestionsDisplay = styled("div")`
  position: relative;
  overflow: auto;
  width: 90%;
  height: 80%;
`;

export const QuestionsDiv = styled("div")`
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 600px;
  width: 60%;
  min-width: 400px;
`;

export const QuestionsHeader = styled(ListItem)`
  width: 90%;
  justify-content: center;
  padding: 0px;
  height: 50px;
  margin-bottom: 15px;
`;

export const AddQuestionButton = styled(Button)`
  width: 35%;
  margin-right: 5px;
  border-radius: 12px;
`;

export const SelectFromExistingButton = styled(Button)`
  width: 65%;
  margin-left: 5px;
  border-radius: 12px;
`;

export const QuestionTitle = styled("h4")`
  margin: 5px;
  margin-bottom: 0px;
  padding-left: 40px;
  font-weight: normal;
`;

export const QuestionContent = styled("div")`
  display: flex;
  padding-top: 10px;
  padding-bottom: 10px;
`;
