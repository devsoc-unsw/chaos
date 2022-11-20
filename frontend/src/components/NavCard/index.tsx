import "twin.macro";

import Card from "components/Card";

import type { ComponentProps, PropsWithChildren, ReactNode } from "react";

type Props = {
  title: ReactNode;
} & Omit<ComponentProps<typeof Card>, "title">;

const NavCard = ({ title, children, ...props }: PropsWithChildren<Props>) => (
  <Card as="nav" tw="w-80" {...props}>
    <h2 tw="mb-4 text-2xl">{title}</h2>
    <ul tw="flex flex-col gap-1">{children}</ul>
  </Card>
);

export default NavCard;
