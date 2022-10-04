import tw, { styled } from "twin.macro";

const MessagePopup = styled.div({
  ...tw`w-52 p-2 rounded shadow`,
  variants: {
    type: {
      error: tw`bg-red-400`,
      warning: tw`bg-yellow-400`,
      success: tw`bg-green-400`,
    },
  },
});

export default MessagePopup;
