import tw, { styled } from "twin.macro";

import { Pulse } from "styles/animations";

import type { ComponentProps } from "react";

const Bar = styled(Pulse, {
  ...tw`h-3 rounded-sm`,

  variants: {
    color: {
      black: tw`bg-black`,
      red: tw`bg-red-600`,
    },
    standalone: {
      true: tw`bg-opacity-10!`,
      false: tw`(bg-opacity-5 first:bg-opacity-[0.15])!`,
    },
  },

  defaultVariants: {
    standalone: false,
    color: "black",
  },
});

const PulsingBar = ({
  animationDelay = 0,
  ...props
}: ComponentProps<typeof Bar> & { animationDelay?: number }) => (
  <Bar
    tw="h-3 rounded-sm"
    style={{ animationDelay: `${animationDelay}ms` }}
    {...props}
  />
);

export default PulsingBar;
