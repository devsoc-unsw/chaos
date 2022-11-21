import { Tab } from "@headlessui/react";
import tw, { styled } from "twin.macro";

// typescript doesn't work play nice with Tabs wrapped with stitches :(
const TabContents = styled("div", {
  ...tw`
    px-3 py-2 border border-transparent outline-none
    group-focus:(ring border-indigo-500) ring-blue-600 ring-opacity-30
  `,

  variants: {
    active: {
      true: tw`rounded shadow bg-white border-gray-200 text-indigo-600`,
      false: tw`text-gray-700`,
    },
  },
});

type Props = {
  tabs: string[];
  selectedTab: number;
};
const Tabs = ({ tabs, selectedTab }: Props) => (
  <Tab.List tw="flex gap-1">
    {tabs.map((tab, i) => (
      <Tab tw="outline-none" className="group">
        <TabContents active={i === selectedTab}>{tab}</TabContents>
      </Tab>
    ))}
  </Tab.List>
);

export default Tabs;
