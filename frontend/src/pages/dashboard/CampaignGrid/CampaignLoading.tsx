import tw, { styled } from "twin.macro";

import type { HTMLAttributes } from "react";

const Bar = ({
  animationDelay,
  ...props
}: HTMLAttributes<HTMLDivElement> & { animationDelay: number }) => (
  <div
    tw="h-2.5 rounded-sm bg-black/5 first:bg-black/[0.15] animate-pulse"
    css={{ animationDelay: `${animationDelay}ms` }}
    // eslint-disable-next-line react/jsx-props-no-spreading
    {...props}
  />
);

const Button = styled.button({
  ...tw`px-2 py-1.5 ml-auto rounded-[0.2rem] text-transparent animate-pulse`,

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
  <div tw="w-72 bg-white text-xs rounded shadow-md transition hover:(-translate-y-1 shadow-lg)">
    <header tw="flex items-center gap-1.5 p-3">
      <div
        tw="w-7 h-7 rounded-sm bg-black/10 animate-pulse"
        css={{ animationDelay: `${animationDelay}ms` }}
      />
      <Bars>
        <Bar tw="w-28" animationDelay={animationDelay} />
        <Bar tw="w-24" animationDelay={animationDelay + 150} />
      </Bars>
      <Button status={status} css={{ animationDelay: `${animationDelay}ms` }}>
        {status?.toUpperCase()}
      </Button>
    </header>
    <div tw="h-28 bg-[#edeeef]" />
    {status === "pending" && (
      <Bars tw="p-3">
        <Bar tw="w-40" animationDelay={animationDelay + 300} />
        <Bar tw="w-32" animationDelay={animationDelay + 450} />
        <Bar tw="w-28" animationDelay={animationDelay + 600} />
      </Bars>
    )}
  </div>
);

export default CampaignLoading;
