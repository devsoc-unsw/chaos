import { Link, useParams } from "react-router-dom";
import tw, { styled } from "twin.macro";

import type { Role } from "types/api";

const RoleItem = styled(Link, {
  ...tw`block px-3 py-1.5 rounded w-full text-left font-normal`,

  ...tw`relative z-0 hover:before:opacity-20`,
  "&::before": {
    content: "",
    ...tw`
      absolute inset-0 z-[-1]
      rounded bg-gradient-to-r from-blue-300 to-violet-300
      opacity-0 transition-opacity
    `,
  },

  variants: {
    active: {
      true: tw`shadow-sm before:opacity-30!`,
    },
  },
});

type Props = {
  roles: Role[];
};
const RolesSidebar = ({ roles }: Props) => {
  const roleId = Number(useParams().roleId);
  return (
    <nav tw="absolute bottom-0 left-0 p-4 bg-white shadow-xl top-16 w-80">
      <h2 tw="mb-4 text-2xl">Roles</h2>
      <ul tw="flex flex-col gap-1">
        {roles.map((role) => (
          <li key={role.id}>
            <RoleItem to={`${role.id}/marking`} active={role.id === roleId}>
              {role.name}
            </RoleItem>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default RolesSidebar;
