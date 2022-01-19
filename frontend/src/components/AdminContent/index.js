import React, { useState } from 'react'
import { AdminContentContainer, ContentHeader, ToggleButtonContainer, OrgInfo, ContentBody } from './adminContent.styled'
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';

import { orgContext } from '../../pages/admin';

// FIXME: content not aligned with sidebar, need to change sidebar :(

const AdminContent = ({ id, icon, orgName }) => {
  // since there are only 2 states, window is a Boolean where
  // true -> members and false -> campaigns
  const [windowSelected, setWindowSelected] = useState("campaigns");
  const {orgSelected, setOrgSelected, orgList, setOrgList} = React.useContext(orgContext);

  const handleDeletion = () => {
    if (orgSelected === id) {
      // FIXME: doesn't handle no remaining orgs, also assumes that
      //        an org exists with id == 0, and that the user is a member 
      //        of this org. Will be fixed when itegrated with backend.
      setOrgSelected(0);
    }
    setOrgList(orgList.filter((org) => org.id != id));
  }

  const handleWindowChange = (e, newWindow) => {
    if (newWindow === "delete") {
      handleDeletion()
      setWindowSelected("campaigns");
    } else {
      setWindowSelected(newWindow);
    }
  };

  return (
    <AdminContentContainer>
      <ContentHeader>
        <OrgInfo>
          <img 
            src={icon}
            style={{
              height: '100px',
              width: '100px',
              margin: '45px',
              marginLeft: '80px',
              borderRadius: '12px',
            }}
          >
          </img>
          <div style={{
            display: 'inline-flex',
            alignSelf: 'center',
            fontSize: '3rem'}}
          >{orgName}
          </div>
        </OrgInfo>
        <ToggleButtonContainer>
          <ToggleButtonGroup
            color="primary"
            value={windowSelected}
            size="large"
            exclusive
            onChange={handleWindowChange}
          >
            <ToggleButton value="campaigns">Campaigns</ToggleButton>
            <ToggleButton value="members">Members</ToggleButton>
            <ToggleButton value="delete"><ClearIcon /></ToggleButton>
          </ToggleButtonGroup>
        </ToggleButtonContainer>
      </ContentHeader>
      <ContentBody>

      </ContentBody>
    </AdminContentContainer>
  )
}

export default AdminContent
