import { Menu } from "@headlessui/react";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
<<<<<<< HEAD
import tw from "twin.macro";
=======
import "twin.macro";
>>>>>>> CHAOS-491-migration-away-from-mui

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
        <Card tw="absolute right-0 z-20 mt-5 gap-1 p-1 text-left">
          {children}
        </Card>
      </Menu.Items>
    </div>
  </Menu>
);

export default Dropdown;
