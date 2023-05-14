import { Menu } from "@headlessui/react";

import type { ReactElement } from "react";

import tw from "twin.macro";

type Props = {
  name: string;
  onClick: () => void;
  icon: ReactElement;
};

const DropdownOption = ({ name, onClick, icon }: Props) => (
  <Menu.Item>
    {({ active }) => (
      <a onClick={onClick}>
        {icon}
        {name}
      </a>
    )}
  </Menu.Item>
);

export default DropdownOption;
