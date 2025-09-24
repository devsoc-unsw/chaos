import { Popover } from "@mui/material";
import { useState } from "react";

import Button from "components/Button";
import Input from "components/Input";
import { TypographyH6 } from "components/Typography";

import "twin.macro";

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
      <div tw="flex flex-col gap-4 p-4 px-6">
        <TypographyH6>{title}</TypographyH6>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(formValues);
          }}
        >
          <div tw="flex flex-col gap-4">
            <div tw="flex flex-row gap-2">
              <Input.Label>
                <Input.LabelText required>{label}</Input.LabelText>
                <Input
                  required
                  value={formValues[name]}
                  onChange={handleInputChange}
                />
              </Input.Label>
              <Button type="submit">{submitText}</Button>
            </div>
            {typeof children === "function"
              ? children({ formValues, setFormValue, handleInputChange })
              : children}
          </div>
        </form>
      </div>
    </Popover>
  );
};

export default InputPopup;
