import tw, { styled } from "twin.macro";

const NavItem = styled.div({
  ...tw`block w-full rounded px-3 py-1.5 text-left font-normal`,

  ...tw`relative z-0 hover:before:opacity-20`,
  "&::before": {
    content: "",
    ...tw`absolute inset-0 z-[-1] rounded bg-gradient-to-r from-blue-300 to-violet-300 opacity-0 transition-opacity`,
  },

  variants: {
    active: {
      true: tw`before:opacity-30! shadow-sm`,
    },
  },
});

export default NavItem;
