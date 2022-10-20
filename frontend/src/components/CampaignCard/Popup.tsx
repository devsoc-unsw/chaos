import { Modal } from "components";

import type { CampaignWithRoles } from "types/api";

type Props = {
  appliedFor: CampaignWithRoles["applied_for"];
  positions: { id: number | string; name: string; number: number }[];
  open: boolean;
  closeModal: () => void;
};
const Popup = ({ appliedFor, positions, open, closeModal }: Props) => {
  const positionsMap = Object.fromEntries(
    positions.map(({ id, ...position }) => [id, position])
  );
  const positionStatuses = Object.fromEntries(
    appliedFor.map(([id, status]) => [
      id,
      { position: positionsMap[id].name, status },
    ])
  );

  return (
    <Modal
      title="Campaign Roles"
      description="Roles available for this campaign"
      open={open}
      closeModal={closeModal}
    >
      <ul tw="flex flex-col gap-0.5">
        {positions.map((pos) => (
          <li key={pos.id} tw="p-1">
            {pos.name} - {positionStatuses[pos.id]?.status}
          </li>
        ))}
      </ul>
    </Modal>
  );
};

export default Popup;
