import tw, { styled } from "twin.macro";

const NavItem = styled.div({
  ...tw`block w-full rounded px-3 py-1.5 text-left font-normal`,

  ...tw`relative z-0 hover:before:opacity-20`,
  "&::before": {
    content: "",
    // eslint-disable-next-line prettier/prettier
    ...tw`
      absolute inset-0 z-[-1]
      bg-gradient-to-r from-blue-300 to-violet-300
      rounded opacity-0 transition-opacity
    `,
  },

  variants: {
    active: {
      true: tw`shadow-sm before:opacity-30!`,
    },
  },
});

export default NavItem;
