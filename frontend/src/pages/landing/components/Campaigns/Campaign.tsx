import { Fragment } from "react";
import tw, { styled } from "twin.macro";

import { Transition } from "components";

import type { HTMLAttributes } from "react";

const Bar = ({
  transitionDelay,
  ...props
}: HTMLAttributes<HTMLDivElement> & { transitionDelay: number }) => (
  <Transition.Child
    as={Fragment}
    enter={tw`transition-[width] duration-500`}
    enterFrom={tw`w-0!`}
  >
    <div
      tw="h-2.5 rounded-sm bg-black/5 first:bg-black/[0.15] transition-[width] duration-500"
      style={{ transitionDelay: `${transitionDelay}ms` }}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    />
  </Transition.Child>
);

const Button = styled.button({
  ...tw`px-2 py-1.5 ml-auto rounded-[0.2rem]`,

  variants: {
    status: {
      pending: tw`bg-[hsl(220, 60%, 90%)] text-[hsl(220, 60%, 25%)]`,
      open: tw`bg-[hsl(220, 93%, 60%)] text-white`,
    },
  },
});

const Bars = tw.div`flex flex-col gap-1`;

type Props = {
  logo: string;
  active?: boolean;
  transitionDelay?: number;
};
const Campaign = ({ logo, active = false, transitionDelay = 0 }: Props) => {
  const status = active ? "pending" : "open";
  return (
    <Transition
      appear
      enter={tw`transition duration-500`}
      enterFrom={tw`opacity-0 scale-90 translate-y-4`}
      style={{ transitionDelay: `${transitionDelay}ms` }}
    >
      <div tw="w-72 bg-white rounded shadow-md transition hover:(-translate-y-1 shadow-lg)">
        <header tw="flex items-center gap-1.5 p-3">
          <img tw="w-7 rounded-sm" src={logo} alt="logo" />
          <Bars>
            <Bar tw="w-28" transitionDelay={transitionDelay} />
            <Bar tw="w-24" transitionDelay={transitionDelay + 150} />
          </Bars>
          <Button status={status}>{status.toUpperCase()}</Button>
        </header>
        <div tw="h-28 bg-[#edeeef]" />
        {active && (
          <Bars tw="p-3">
            <Bar tw="w-40" transitionDelay={transitionDelay + 300} />
            <Bar tw="w-32" transitionDelay={transitionDelay + 450} />
            <Bar tw="w-28" transitionDelay={transitionDelay + 600} />
          </Bars>
        )}
      </div>
    </Transition>
  );
};

export default Campaign;
