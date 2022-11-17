import { keyframes } from "@stitches/react";
import tw, { styled } from "twin.macro";

export const pulse = keyframes({
  "50%": tw`opacity-50`,
});

export const pulseCss = {
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  animation: `${pulse} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
};

export const Pulse = styled("div", pulseCss);
