import { Menu } from "@headlessui/react";
<<<<<<< HEAD
import tw from "twin.macro";
=======
import "twin.macro";
>>>>>>> CHAOS-491-migration-away-from-mui

import type { ComponentProps, MouseEvent, ReactElement } from "react";

type Props = {
  name: string;
  onClick: () => void;
  icon: ReactElement;
} & ComponentProps<typeof Menu.Item>;

const DropdownOption = ({ name, onClick, icon, ...props }: Props) => (
  <Menu.Item tw="w-24 border-slate-400" {...props}>
    {({ close }) => (
      <button
        tw="rounded p-2 text-left ui-active:bg-blue-500 ui-active:text-white ui-not-active:bg-white ui-not-active:text-black"
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
