import { Tab } from "@headlessui/react";
import { Fragment } from "react";
import tw, { styled } from "twin.macro";

import type { ComponentProps } from "react";

const TabList = styled(Tab.List, {
  ...tw`flex gap-1`,

  variants: {
    /**
     * Display the tab list in a vertical column rather than a row.
     * Make sure to include the `vertical` prop on the containing `Tab.Group` for accessibility if this is true.
     */
    vertical: {
      true: tw`flex-col`,
    },
  },
});

const TabButton = styled("button", {
  ...tw`
    px-3 py-2 border border-transparent rounded outline-none transition
    focus:(ring border-indigo-500) ring-blue-600 ring-opacity-30
  `,

  variants: {
    active: {
      true: tw`shadow bg-white border-gray-300 text-indigo-600 hover:(border-indigo-600 text-indigo-700)`,
      false: tw`text-gray-700 hover:text-indigo-600`,
    },
  },
});

type Props = ComponentProps<typeof TabList> & {
  tabs: { id: number; name: string }[];
};
const Tabs = ({ tabs, vertical, ...props }: Props) => (
  <TabList as="div" vertical={vertical} {...props}>
    {tabs.map(({ id, name }) => (
      <Tab as={Fragment} key={id}>
        {({ selected }) => <TabButton active={selected}>{name}</TabButton>}
      </Tab>
    ))}
  </TabList>
);

export default Tabs;
