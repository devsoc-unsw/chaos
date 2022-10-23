import tw, { styled } from "twin.macro";

import type { Dispatch, SetStateAction } from "react";

const RoleItem = styled.button({
  ...tw`px-3 py-1.5 rounded-sm w-full text-left font-normal`,

  variants: {
    active: {
      true: tw`bg-blue-300/30 shadow-sm`,
    },
  },
});

type Props = {
  roles: string[];
  selectedPosition: string;
  setSelectedPosition: Dispatch<SetStateAction<string>>;
};
const RolesSidebar = ({
  roles,
  selectedPosition,
  setSelectedPosition,
}: Props) => (
  <nav tw="absolute bottom-0 left-0 p-4 bg-white shadow-xl top-16 w-80">
    <h2 tw="mb-4 text-2xl">Roles</h2>
    <ul tw="flex flex-col gap-1">
      {roles.map((role) => (
        <li>
          <RoleItem
            active={role === selectedPosition}
            onClick={() => setSelectedPosition(role)}
          >
            {role}
          </RoleItem>
        </li>
      ))}
    </ul>
  </nav>
);

export default RolesSidebar;
