import React, { useState } from "react";
import PropTypes from "prop-types";
import { Box, Button, Popover, TextField, Typography } from "@mui/material";

const InputPopup = ({
  children,
  title,
  label,
  name,
  defaultState,
  submitText,
  onSubmit,
  open,
  anchorEl,
  setAnchorEl,
}) => {
  const [formValues, setFormValues] = useState({ [name]: "", ...defaultState });
  const setFormValue = (key, value) => {
    setFormValues({
      ...formValues,
      [key]: value,
    });
  };
  const handleInputChange = (e) => {
    // eslint-disable-next-line no-shadow
    const { name, value } = e.target;
    setFormValue(name, value);
  };
  return (
    <Popover
      open={open}
      onClose={() => setAnchorEl(null)}
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      transformOrigin={{
        horizontal: "right",
      }}
    >
      <Box p={2} display="flex" flexDirection="column" gap={2}>
        <Typography variant="h6">{title}</Typography>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(formValues);
          }}
        >
          <Box display="flex" flexDirection="column" gap={1}>
            <Box display="flex" gap={1}>
              <TextField
                label={label}
                name={name}
                size="small"
                autoFocus
                value={formValues[name]}
                onChange={handleInputChange}
              />
              <Button type="submit">{submitText}</Button>
            </Box>
            {typeof children === "function"
              ? children({ formValues, setFormValue, handleInputChange })
              : children}
          </Box>
        </form>
      </Box>
    </Popover>
  );
};

InputPopup.propTypes = {
  // eslint-disable-next-line react/require-default-props
  children: PropTypes.func,
  title: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  // eslint-disable-next-line react/forbid-prop-types, react/require-default-props
  defaultState: PropTypes.object,
  submitText: PropTypes.string.isRequired,
  onSubmit: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  // eslint-disable-next-line react/require-default-props -- we want to allow null here
  anchorEl: PropTypes.instanceOf(Element),
  setAnchorEl: PropTypes.func.isRequired,
};

export default InputPopup;
