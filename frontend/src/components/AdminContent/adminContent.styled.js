import { styled as muiStyled } from "@mui/material/styles";

export const AdminContentContainer = muiStyled('div')(() => ({
  flex: '1 0 auto',
  height: '100%',
  backgroundColor: 'white'
}));

export const ToggleButtonContainer = muiStyled('div')(() => ({
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  backgroundColor: 'white',
  height: '100%',
  width: '50%',
  marginRight: '80px'
}));

export const ContentHeader = muiStyled('div')(() => ({
  display: 'flex',
  justifyContent: 'space-between',
  width: '100%',
  height: '200px',
  backgroundColor: 'white',
  alignItems: 'center'
}));

export const OrgInfo = muiStyled('div')(() => ({
  display: 'flex',
  width: '50%',
  height: '100%',
  alignItems: 'center'
}));

export const ContentBody = muiStyled('div')(() => ({
  margin: '80px',
  marginTop: '0px',
  height: '69%',
  borderColor: 'grey',
  borderStyle: 'solid',
  borderRadius: '12px',
  borderWidth: '1px',
  backgroundColor: '#f0f4fc'
}));
