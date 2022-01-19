import { styled as muiStyled } from "@mui/material/styles";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import styled from "@emotion/styled";

export const SidebarContainer = muiStyled('div')(({ isFormOpen, sidebarWidth }) => ({
  position:'relative',
  width: isFormOpen ? '280px' : sidebarWidth,
  height: '100%',
  backgroundColor: '#f0f4fc',
  transition: '0.2s',
  borderRightWidth: '1px',
  borderRightStyle: 'solid',
  borderColor: 'grey',
  overflow: 'hidden'
}));

export const OrgButtonGroup = muiStyled(ToggleButtonGroup)(() => ({
  position: 'absolute',
  top: '0',
  left: '0',
  width: '100%',
  padding: '0px',
  margin:'0px'
}));

export const OrgButton = muiStyled(ToggleButton)(() => ({
  position: 'relative',
  display: 'table',
  width: '100%',
  listStyle: 'none',
  height: '90px',
  padding: '5px',
  verticalAlign: 'middle'
}));

export const CreateOrgButton = muiStyled(OrgButton)(({ isFormOpen }) => ({
  height: isFormOpen ? '180px' : '90px'
}));

export const OrgIcon = muiStyled('span')(() => ({
  display: 'block',
  minWidth: '60px',
  height: '60px',
  lineHeight: '60px',
  margin: '0px'
}));

export const OrgName = muiStyled('span')(() => ({
  position: 'relative',
  display: 'block',
  padding: '0 10px',
  height: '60px',
  lineHeight: '60px',
  textAlign: 'start',
  whiteSpace: 'nowrap',
  paddingLeft: '25px'
}));
