import { ChevronUpDownIcon } from "@heroicons/react/20/solid";
import tw, { styled } from "twin.macro";

import type { ComponentProps, PropsWithChildren } from "react";

const StatusIndicator = ({
  children,
  ...props
}: PropsWithChildren<ComponentProps<"button">>) => (
  // eslint-disable-next-line react/jsx-props-no-spreading
  <button type="button" {...props}>
    <ChevronUpDownIcon tw="-mx-0.5 h-4 w-4" />
    {children}
  </button>
);

const CampaignStatus = styled(StatusIndicator, {
  ...tw`ml-auto flex items-center gap-1 px-2 py-1.5 text-white rounded-[0.2rem]`,

  variants: {
    status: {
      pending: tw`text-black bg-[hsl(220, 60%, 90%)]`,
      open: tw`bg-[hsl(220, 93%, 60%)]`,
      closed: tw`bg-gray-100 text-black`,
      offered: tw`bg-green-200 text-green-900`,
      rejected: tw`bg-red-200 text-red-900`,
    },
  },

  defaultVariants: {
    status: "open",
  },
});

export default CampaignStatus;
