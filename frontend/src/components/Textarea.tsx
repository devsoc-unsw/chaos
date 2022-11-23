import tw, { styled } from "twin.macro";

const styles = {
  ...tw`
    form-textarea block w-full rounded-md
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
};

const Textarea = styled("textarea", styles);
const Wrapper = styled("label", {
  ...styles,
  ...tw`p-0 overflow-hidden`,
});
const Header = tw.header`px-3 py-2 flex items-center bg-gray-100 border-b border-gray-200`;

export default Object.assign(Textarea, {
  Wrapper,
  Header,
});
