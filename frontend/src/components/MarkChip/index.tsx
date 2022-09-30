import { ColoredChip } from "./markChip.styled";

import type { ComponentProps, MouseEventHandler } from "react";

type Props = {
  mark: number;
  decimal?: boolean;
  colored: boolean;
  variant?: ComponentProps<typeof ColoredChip>["variant"];
  clickable?: boolean;
  onClick?: MouseEventHandler<HTMLDivElement>;
};

const MarkChip = ({
  mark,
  decimal,
  colored,
  variant = "filled",
  clickable,
  onClick,
}: Props) => (
  <ColoredChip
    label={decimal ? mark.toFixed(2) : mark}
    mark={mark}
    colored={colored}
    variant={variant}
    clickable={clickable}
    onClick={onClick}
  />
);

export default MarkChip;
