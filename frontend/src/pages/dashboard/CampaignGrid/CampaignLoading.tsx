import tw, { styled } from "twin.macro";

import PulsingBar from "components/PulsingBar";
import { Pulse, pulseCss } from "styles/animations";

const Button = styled(Pulse, {
  ...tw`ml-auto rounded-[0.2rem] px-2 py-1.5 text-transparent`,
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
  <div tw="w-96 rounded bg-white text-xs shadow-md transition hover:-translate-y-1 hover:shadow-lg">
    <header tw="flex items-center gap-1.5 p-3">
      <PulsingBar tw="h-10 w-10" animationDelay={animationDelay} standalone />
      <Bars>
        <PulsingBar tw="w-36" animationDelay={animationDelay} />
        <PulsingBar tw="w-32" animationDelay={animationDelay + 150} />
      </Bars>
      <Button status={status} style={{ animationDelay: `${animationDelay}ms` }}>
        {status?.toUpperCase()}
      </Button>
    </header>
    <div tw="aspect-h-9 aspect-w-16 bg-[#edeeef]" />
  </div>
);

export default CampaignLoading;
