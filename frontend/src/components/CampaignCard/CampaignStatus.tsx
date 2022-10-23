import { ChevronUpDownIcon } from "@heroicons/react/20/solid";
import tw, { styled } from "twin.macro";

import type { ComponentProps, PropsWithChildren } from "react";

const StatusIndicator = ({
  children,
  ...props
}: PropsWithChildren<ComponentProps<"button">>) => (
  // TODO: open roles popup on click
  // TODO: i really do not like this (in terms of ui/ux), is there a better way to do it?
  // eslint-disable-next-line react/jsx-props-no-spreading
  <button type="button" {...props}>
    <ChevronUpDownIcon tw="w-4 h-4 -mx-0.5" />
    {children}
  </button>
);

const CampaignStatus = styled(StatusIndicator, {
  ...tw`px-2 py-1.5 flex items-center gap-1 ml-auto rounded-[0.2rem] text-white`,

  variants: {
    status: {
      pending: tw`bg-[hsl(220, 60%, 90%)] text-black`,
      open: tw`bg-[hsl(220, 93%, 60%)]`,
      closed: tw`bg-gray-100 text-black`,
      offered: tw`bg-green-300 text-green-900`,
      rejected: tw`bg-red-300 text-red-900`,
    },
  },

  defaultVariants: {
    status: "open",
  },
});

export default CampaignStatus;
