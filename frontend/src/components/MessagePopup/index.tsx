import tw, { styled } from "twin.macro";

const MessagePopup = styled.div({
  ...tw`w-72 p-2 rounded-lg drop-shadow-lg border`,
  variants: {
    type: {
      error: tw`bg-red-400 border-red-600`,
      warning: tw`bg-yellow-300 border-yellow-500`,
      success: tw`bg-green-400 border-green-600`,
    },
  },
});

export default MessagePopup;
