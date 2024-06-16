import tw, { styled } from "twin.macro";

const styles = {
  ...tw`form-textarea block w-full rounded-md border-gray-300 shadow-sm transition hover:border-blue-300 focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50`,

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
  ...tw`overflow-hidden p-0`,
});
const Header = tw.header`flex items-center border-b border-gray-200 bg-gray-100 px-3 py-2`;

export default Object.assign(Textarea, {
  Wrapper,
  Header,
});
