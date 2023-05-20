import { Menu } from "@headlessui/react";

import type { ComponentProps, MouseEvent, ReactElement } from "react";

import tw from "twin.macro";

type Props = {
  name: string;
  onClick: () => void;
  icon: ReactElement;
} & ComponentProps<typeof Menu.Item>;

const DropdownOption = ({ name, onClick, icon, ...props }: Props) => (
  <Menu.Item tw="w-24 border-slate-400" {...props}>
    {({ close }) => (
      <button
        tw="text-left p-2 rounded ui-active:bg-blue-500 ui-active:text-white ui-not-active:bg-white ui-not-active:text-black"
        onClick={(e: MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation();
          e.preventDefault();
          onClick();
          close();
        }}
        type="button"
      >
        {icon}
        {name}
      </button>
    )}
  </Menu.Item>
);

export default DropdownOption;
