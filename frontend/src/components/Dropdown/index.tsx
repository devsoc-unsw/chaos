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
    <div tw="relative ml-auto">
      <Menu.Button>
        <EllipsisVerticalIcon tw="h-6 w-6" aria-hidden="true" />
      </Menu.Button>
      <Menu.Items>
        <Card tw="gap-1 mt-5 absolute right-0 z-20 text-left p-1">
          {children}
        </Card>
      </Menu.Items>
    </div>
  </Menu>
);

export default Dropdown;
