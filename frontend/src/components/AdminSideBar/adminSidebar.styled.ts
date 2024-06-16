import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import tw, { styled } from "twin.macro";

export const SidebarContainer = tw.div`relative h-full w-[80px] overflow-hidden border-r border-solid border-gray-300 bg-[#f0f4fc] transition-all duration-200 hover:w-[280px]`;

export const OrgButtonGroup = styled(ToggleGroup.Root, {
  ...tw`m-0 w-full p-0`,
});

export const OrgButton = styled(ToggleGroup.Item, {
  ...tw`relative table h-[90px] w-full cursor-pointer list-none bg-transparent p-[5px] align-middle font-medium uppercase text-[#000000aa] transition-colors hover:bg-gray-200 hover:text-[#000000] data-[state='on']:bg-gray-200`,
});

export const OrgButtonContent = tw.div`flex p-1`;

export const CreateOrgButton = styled("button", {
  ...tw`h-[90px] w-full border-b-0 p-[5px] hover:bg-gray-200 hover:text-[#000000]`,
});

export const CreateOrgIcon = styled(AddIcon, {
  ...tw`m-[14px] text-[30px]`,
});

export const RemoveOrgIcon = styled(RemoveIcon, {
  ...tw`m-[14px] text-[30px]`,
});

export const OrgIcon = tw.span`m-0 block h-[60px] min-w-[60px] leading-[60px]`;

export const OrgIconImage = tw.img`h-[60px] w-[60px] rounded-[12px]`;

export const OrgName = tw.span`relative block h-[60px] whitespace-nowrap p-0 px-[10px] pl-[25px] text-left leading-[60px]`;
