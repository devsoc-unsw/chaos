import { Link, useParams } from "react-router-dom";
import "twin.macro";

import NavCard from "components/NavCard";
import NavItem from "components/NavCard/NavItem";

import type { Role } from "types/api";

type Props = {
  roles: Role[];
};
const RolesSidebar = ({ roles }: Props) => {
  const roleId = String(useParams().roleId);
  return (
    <NavCard
      tw="fixed bottom-0 left-0 top-16 rounded-none shadow-xl"
      title="Roles"
    >
      {roles.map((role) => (
        <li key={role.id}>
          <NavItem
            as={Link}
            to={`${role.id}/marking`}
            active={role.id === roleId}
          >
            {role.name}
          </NavItem>
        </li>
      ))}
    </NavCard>
  );
};

export default RolesSidebar;
