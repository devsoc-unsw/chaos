import tw, { styled } from "twin.macro";

const Card = styled.div({
  ...tw`flex flex-col rounded bg-white p-4 shadow-md`,

  variants: {
    hoverable: {
      true: tw`transition hover:(-translate-y-1 shadow-lg)`,
    },
  },
});

export default Card;
