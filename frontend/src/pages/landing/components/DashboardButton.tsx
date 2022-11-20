import { ChevronRightIcon } from "@heroicons/react/24/solid";
import tw, { styled } from "twin.macro";

import type { ComponentProps, ElementType, PropsWithChildren } from "react";

const Button = tw.button`
  relative flex items-center justify-center
  w-max px-3 py-2
  rounded border-0 text-[#191d24] font-normal outline-none ring-blue-500 transition
  hover:text-black focus-visible:(text-black ring)
`;

const Bg = tw.div`
  absolute inset-0 z-[-1]
  rounded transition
  from-fuchsia-200 to-indigo-200 bg-gradient-120
`;

const ButtonShadow = styled(Bg, {
  ...tw`blur-sm filter group-hover:(translate-y-0.5 blur) group-focus-visible:blur group-active:blur-sm`,
});

const ButtonBg = styled(Bg, {
  ...tw`opacity-50 group-hover:opacity-100 group-focus-visible:opacity-100`,
});

type Props<T extends ElementType> = ComponentProps<typeof Button> & {
  as?: T;
} & ComponentProps<T>;

const DashboardButton = <T extends ElementType>({
  children,
  ...props
}: PropsWithChildren<Props<T>>) => (
  <Button className="group" {...props}>
    <ButtonShadow />
    <ButtonBg />
    <ChevronRightIcon tw="h-6 w-6" />
    {children}
  </Button>
);

export default DashboardButton;
