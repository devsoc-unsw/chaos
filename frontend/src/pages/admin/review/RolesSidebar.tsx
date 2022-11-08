import { Link, useParams } from "react-router-dom";
import tw, { styled } from "twin.macro";

import NavCard from "components/NavCard";

import type { Role } from "types/api";

const RoleItem = styled(Link, {
  ...tw`block w-full rounded px-3 py-1.5 text-left font-normal`,

  ...tw`relative z-0 hover:before:opacity-20`,
  "&::before": {
    content: "",
    // eslint-disable-next-line prettier/prettier
    ...tw`
      absolute inset-0 z-[-1]
      bg-gradient-to-r from-blue-300 to-violet-300
      rounded opacity-0 transition-opacity
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
    <NavCard
      tw="fixed bottom-0 left-0 top-16 rounded-none shadow-xl"
      title="Roles"
    >
      {roles.map((role) => (
        <li key={role.id}>
          <RoleItem to={`${role.id}/marking`} active={role.id === roleId}>
            {role.name}
          </RoleItem>
        </li>
      ))}
    </NavCard>
  );
};

export default RolesSidebar;
