import tw, { styled } from "twin.macro";

const MessagePopup = styled.div({
  ...tw`w-72 p-2 rounded-md drop-shadow-lg shadow-md`,
  variants: {
    type: {
      error: tw`bg-red-300 text-red-900`,
      warning: tw`bg-yellow-100 text-yellow-900`,
      success: tw`bg-lime-200 text-lime-900`,
    },
  },
});

export default MessagePopup;
