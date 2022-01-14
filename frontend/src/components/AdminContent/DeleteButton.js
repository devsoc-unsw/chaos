import React, { useState } from 'react'
import IconButton from '@mui/material/IconButton';
import ClearIcon from '@mui/icons-material/Clear';

import { orgContext } from '../../pages/admin';

// FIXME: style to look nice with other buttons!
const DeleteButton = ({ id }) => {
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

  return (
    <IconButton>
      <ClearIcon style={{fill: 'grey'}} onClick={() => handleDeletion()}/>
    </IconButton>
  )
}

export default DeleteButton;
