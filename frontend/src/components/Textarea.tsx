import tw, { styled } from "twin.macro";

const Textarea = styled("textarea", {
  ...tw`
    block w-full rounded-md
    border-gray-300 shadow-sm
    transition
    hover:border-blue-300
    focus:(border-blue-300 ring ring-blue-200 ring-opacity-50)
  `,

  variants: {
    size: {
      md: tw`min-h-48`,
      lg: tw`min-h-64`,
    },
  },
});

export default Textarea;
