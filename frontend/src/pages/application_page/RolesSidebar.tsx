import "twin.macro";

import NavCard from "components/NavCard";
import NavItem from "components/NavCard/NavItem";

import type { Role } from "types/api";

type Props = {
  roles: Role[];
  rolesSelected: number[];
  toggleRole: (_roleId: number) => void;
};
const RolesSidebar = ({ roles, rolesSelected, toggleRole }: Props) => (
  <NavCard tw="w-72" title="Roles">
    {roles.map((role) => (
      <li key={role.id}>
        <NavItem
          as="button"
          active={rolesSelected.includes(role.id)}
          onClick={() => toggleRole(role.id)}
        >
          {role.name}
        </NavItem>
      </li>
    ))}
  </NavCard>
);

export default RolesSidebar;
