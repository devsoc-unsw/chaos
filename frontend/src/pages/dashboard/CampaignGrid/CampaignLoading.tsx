import tw, { styled } from "twin.macro";

import { Pulse, pulseCss } from "styles/animations";

import type { HTMLAttributes } from "react";

const Bar = ({
  animationDelay,
  ...props
}: HTMLAttributes<HTMLDivElement> & { animationDelay: number }) => (
  <Pulse
    tw="h-3 rounded-sm bg-black/5 first:bg-black/[0.15]"
    style={{ animationDelay: `${animationDelay}ms` }}
    // eslint-disable-next-line react/jsx-props-no-spreading
    {...props}
  />
);

const Button = styled("button", {
  ...tw`ml-auto px-2 py-1.5 text-transparent rounded-[0.2rem]`,
  ...pulseCss,

  variants: {
    status: {
      pending: tw`bg-[hsl(220, 60%, 90%)]`,
      open: tw`bg-[hsl(220, 93%, 60%)]`,
      closed: tw`hidden`,
    },
  },

  defaultVariants: {
    status: "open",
  },
});

const Bars = tw.div`flex flex-col gap-1`;

type Props = {
  status?: "pending" | "open" | "closed";
  animationDelay?: number;
};
const CampaignLoading = ({ status, animationDelay = 0 }: Props) => (
  <div tw="w-96 rounded bg-white text-xs shadow-md transition hover:(-translate-y-1 shadow-lg)">
    <header tw="flex items-center gap-1.5 p-3">
      <Pulse
        tw="w-10 h-10 rounded-sm bg-black/10"
        style={{ animationDelay: `${animationDelay}ms` }}
      />
      <Bars>
        <Bar tw="w-36" animationDelay={animationDelay} />
        <Bar tw="w-32" animationDelay={animationDelay + 150} />
      </Bars>
      <Button status={status} style={{ animationDelay: `${animationDelay}ms` }}>
        {status?.toUpperCase()}
      </Button>
    </header>
    <div tw="bg-[#edeeef] aspect-w-16 aspect-h-9" />
  </div>
);

export default CampaignLoading;
