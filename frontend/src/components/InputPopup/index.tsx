import { Box, Button, Popover, TextField, Typography } from "@mui/material";
import { useState } from "react";

import type {
  ChangeEvent,
  ChangeEventHandler,
  Dispatch,
  ReactNode,
  SetStateAction,
} from "react";

type RenderProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formValues: any;
  setFormValue: (_key: string, _value: string) => void;
  handleInputChange: ChangeEventHandler<HTMLInputElement>;
};

type Props = {
  children: (_props: RenderProps) => ReactNode;
  title: string;
  label: string;
  name: string;
  defaultState: { [k: string]: string };
  submitText: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (formValues: any) => void;
  open: boolean;
  anchorEl: Element | null;
  setAnchorEl: Dispatch<SetStateAction<HTMLElement | null>>;
};

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
}: Props) => {
  const [formValues, setFormValues] = useState({ [name]: "", ...defaultState });
  const setFormValue = (key: string, value: string) => {
    setFormValues({
      ...formValues,
      [key]: value,
    });
  };
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
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
        vertical: "top",
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

export default InputPopup;
