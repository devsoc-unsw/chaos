import "twin.macro";

import Card from "./Card";

import type { ComponentProps, PropsWithChildren } from "react";

type Props = {
  title: string;
} & ComponentProps<typeof Card>;

const NavCard = ({ title, children, ...props }: PropsWithChildren<Props>) => (
  <Card as="nav" tw="w-80" {...props}>
    <h2 tw="mb-4 text-2xl">{title}</h2>
    <ul tw="flex flex-col gap-1">{children}</ul>
  </Card>
);

export default NavCard;
