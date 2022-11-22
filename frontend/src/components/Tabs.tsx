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
      true: tw`rounded shadow bg-white border-gray-300 text-indigo-600`,
      false: tw`text-gray-700`,
    },
  },
});

type Props = {
  tabs: { id: number; name: string }[];
  vertical?: boolean;
};
const Tabs = ({ tabs, vertical }: Props) => (
  <Tab.List tw="flex gap-1" css={{ ...(vertical && tw`flex-col`) }}>
    {tabs.map(({ id, name }) => (
      <Tab key={id} tw="outline-none" className="group">
        {({ selected }) => <TabContents active={selected}>{name}</TabContents>}
      </Tab>
    ))}
  </Tab.List>
);

export default Tabs;
