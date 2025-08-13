import { Tab } from "@headlessui/react";
import { Fragment } from "react";
import tw, { styled } from "twin.macro";

import type { ComponentProps, ReactNode } from "react";

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
  ...tw`rounded border border-transparent px-3 py-2 outline-none ring-blue-600 ring-opacity-30 transition focus:border-indigo-500 focus:ring`,

  variants: {
    active: {
      true: tw`border-gray-300 bg-white text-indigo-600 shadow hover:border-indigo-600 hover:text-indigo-700`,
      false: tw`text-gray-700 hover:text-indigo-600`,
    },
  },
});

type Props = ComponentProps<typeof TabList> & {
  tabs: { id: string; contents: ReactNode }[];
};
const Tabs = ({ tabs, vertical, ...props }: Props) => (
  <TabList as="div" vertical={vertical} {...props}>
    {tabs.map(({ id, contents }) => (
      <Tab as={Fragment} key={id}>
        {({ selected }) => <TabButton active={selected}>{contents}</TabButton>}
      </Tab>
    ))}
  </TabList>
);

export default Tabs;
