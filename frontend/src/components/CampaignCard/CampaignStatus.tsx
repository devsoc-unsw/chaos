import tw, { styled } from "twin.macro";

const CampaignStatus = styled.button({
  ...tw`ml-auto flex items-center gap-1 px-2 py-1.5 text-white rounded-[0.2rem] shadow transition hover:shadow-md`,

  variants: {
    status: {
      pending: tw`text-black bg-[hsl(220, 60%, 90%)] shadow-[hsl(220, 60%, 90%)]!`,
      open: tw`bg-[hsl(220, 93%, 60%)] shadow-[hsla(220, 93%, 60%, 50%)]!`,
      closed: tw`bg-gray-100 text-black`,
      offered: tw`bg-green-200 text-green-900 shadow-green-200! hover:bg-green-300`,
      rejected: tw`bg-red-200 text-red-900 shadow-red-200!`,
    },
  },

  defaultVariants: {
    status: "open",
  },
});

export default CampaignStatus;
