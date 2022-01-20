import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useNavigate } from "react-router-dom";

const BasicMenu = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const onNavClick = (nav='') => {
    if (nav) {
      navigate(nav);
    }
    handleClose();
  }

  return (
    <div>
      <Button
        id="basic-button"
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
      >
        Menu
      </Button>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      > 
        <MenuItem onClick={/*FIXME*/() => onNavClick('/dashboard')}>Dashboard</MenuItem>
        <MenuItem onClick={/*FIXME: should be isSuperUser && <MenuItem> so only displays if is admin */() => onNavClick('/admin')}>Admin</MenuItem>
        <MenuItem onClick={/*FIXME*/handleClose}>Settings</MenuItem>
        <MenuItem onClick={/*FIXME*/handleClose}>Logout</MenuItem>
      </Menu>
    </div>
  );
}

export default BasicMenu;
