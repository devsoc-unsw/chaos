import tw, { styled } from "twin.macro";

import { Pulse } from "styles/animations";

import type { ComponentProps } from "react";

const Bar = styled(Pulse, {
  ...tw`h-3 rounded-sm`,

  variants: {
    standalone: {
      true: tw`bg-black/10`,
      false: tw`bg-black/5 first:bg-black/[0.15]`,
    },
  },
});

const PulsingBar = ({
  animationDelay = 0,
  ...props
}: ComponentProps<typeof Bar> & { animationDelay?: number }) => (
  <Bar
    tw="h-3 rounded-sm bg-black/5 first:bg-black/[0.15]"
    style={{ animationDelay: `${animationDelay}ms` }}
    {...props}
  />
);

export default PulsingBar;
