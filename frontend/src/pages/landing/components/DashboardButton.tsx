import { ChevronRightIcon } from "@heroicons/react/24/solid";
import tw, { styled } from "twin.macro";

import type { ComponentProps, ElementType, PropsWithChildren } from "react";

const Button = tw.button`relative flex w-max items-center justify-center rounded border-0 px-3 py-2 font-normal outline-none ring-blue-500 transition text-[#191d24] hover:text-black focus-visible:(text-black ring)`;

const Bg = tw.div`absolute inset-0 rounded from-fuchsia-200 to-indigo-200 transition bg-gradient-120 z-[-1]`;

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
