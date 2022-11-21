import tw, { styled } from "twin.macro";

const Textarea = styled("textarea", {
  ...tw`
    block w-full mt-1 rounded-md
    border-gray-300 shadow-sm
    transition
    hover:border-blue-300
    focus:(border-blue-300 ring ring-blue-200 ring-opacity-50)
  `,

  variants: {
    size: {
      large: tw`min-h-[12rem]`,
    },
  },
});

export default Textarea;
