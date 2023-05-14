import { Menu } from "@headlessui/react";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import tw from "twin.macro";
import Card from "components/Card";

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

const Dropdown = ({ children }: Props) => (
  <Menu>
    <Menu.Button tw="ml-auto">
      <EllipsisVerticalIcon tw="h-8 w-8" aria-hidden="true" />
    </Menu.Button>
    <Menu.Items tw="absolute top-12 right-0 z-20">
      <Card tw="gap-3"> {children} </Card>
    </Menu.Items>
  </Menu>
);

export default Dropdown;
