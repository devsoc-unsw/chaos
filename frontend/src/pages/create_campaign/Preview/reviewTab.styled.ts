import tw, { styled } from "twin.macro";

import Button from "components/Button";

export const SubmitWrapper = tw.div`flex flex-row justify-center gap-5`;

export const ActionButton = styled(Button, {
  ...tw`text-[20px]`,
});

export const InfoTextBox = styled("div", {
  ...tw`bg-lightgrey-300 flex flex-col p-[3%]`,
});

export const InfoText = tw.div`p-[5px] text-center`;

export const CampaignCardLayout = tw.div`m-0 flex w-full flex-row justify-center py-12`;
