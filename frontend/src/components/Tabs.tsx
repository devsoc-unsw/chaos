import { Tab } from "@headlessui/react";
import { Fragment } from "react";
import tw, { styled } from "twin.macro";

import type { ComponentProps } from "react";

const TabList = styled(Tab.List, {
  ...tw`flex gap-1`,

  variants: {
    vertical: {
      true: tw`flex-col`,
    },
  },
});

const TabButton = styled("button", {
  ...tw`
    px-3 py-2 border border-transparent outline-none
    focus:(ring border-indigo-500) ring-blue-600 ring-opacity-30
  `,

  variants: {
    active: {
      true: tw`rounded shadow bg-white border-gray-300 text-indigo-600`,
      false: tw`text-gray-700`,
    },
  },
});

type Props = {
  tabs: { id: number; name: string }[];
  /**
   * Display the tab list in a vertical column rather than a row.
   * Make sure to include the `vertical` prop on the containing `Tab.Group` for accessibility if this is true.
   */
  vertical?: ComponentProps<typeof TabList>["vertical"];
};
const Tabs = ({ tabs, vertical }: Props) => (
  <TabList as="div" vertical={vertical}>
    {tabs.map(({ id, name }) => (
      <Tab as={Fragment} key={id}>
        {({ selected }) => <TabButton active={selected}>{name}</TabButton>}
      </Tab>
    ))}
  </TabList>
);

export default Tabs;
