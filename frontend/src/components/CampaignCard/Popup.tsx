import tw, { styled } from "twin.macro";

import Modal from "components/Modal";

import type { Position } from "./types";
import type { CampaignWithRoles } from "types/api";

const PositionItem = styled.li({
  ...tw`rounded px-2 py-1.5`,

  variants: {
    status: {
      Draft: tw`bg-gray-50`,
      Pending: tw`bg-gray-100`,
      Rejected: tw`bg-red-100`,
      Success: tw`bg-green-100`,
      undefined: tw`bg-gray-200`,
    },
  },
});

type Props = {
  appliedFor: CampaignWithRoles["applied_for"];
  positions: Position[];
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
       <ul tw="flex flex-col gap-1.5">
    {positions.map((pos) => (
          <PositionItem key={pos.id} status={positionStatuses[pos.id]?.status}>
            {pos.name}
          </PositionItem>
        ))}
      </ul>
    </Modal>
  );
};

export default Popup;
