import tw, { styled } from "twin.macro";
import { Transition } from "components";
import { Fragment, HTMLAttributes } from "react";

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
      tw="transition-[width] duration-500"
      style={{ transitionDelay: `${transitionDelay}ms` }}
      {...props}
    />
  </Transition.Child>
);

const Button = styled.button({
  ...tw`px-3 py-2 ml-auto rounded`,

  variants: {
    status: {
      pending: tw`bg-[hsl(220, 60%, 90%)] text-[hsl(220, 60%, 25%)]`,
      open: tw`bg-[hsl(220, 93%, 60%)] text-white`,
    },
  },
});

const Bars = styled.div({
  ...tw`flex flex-col`,

  [`& > *`]: tw`
    h-[14px] rounded-[3px] bg-black/5 first:bg-black/[0.15]
  `,
});

const Campaign = ({
  logo,
  active = false,
  transitionDelay = 0,
}: {
  logo: string;
  active?: boolean;
  transitionDelay?: number;
}) => {
  const status = active ? "pending" : "open";
  return (
    <Transition
      appear
      enter={tw`transition duration-500`}
      enterFrom={tw`opacity-0 scale-90 translate-y-4`}
      style={{ transitionDelay: `${transitionDelay}ms` }}
    >
      <div tw="w-[25rem] bg-white rounded-lg shadow-md transition hover:(-translate-y-1 shadow-lg)">
        <header tw="flex items-center gap-2 p-4">
          <img tw="w-10 rounded" src={logo} alt="logo" />
          <Bars tw="gap-1">
            <Bar tw="w-40" transitionDelay={transitionDelay} />
            <Bar tw="w-36" transitionDelay={transitionDelay + 150} />
          </Bars>
          <Button status={status}>{status.toUpperCase()}</Button>
        </header>
        <div tw="h-40 bg-[#edeeef]" />
        {active && (
          <Bars tw="gap-1.5 p-4">
            <Bar tw="w-56" transitionDelay={transitionDelay + 300} />
            <Bar tw="w-44" transitionDelay={transitionDelay + 450} />
            <Bar tw="w-40" transitionDelay={transitionDelay + 600} />
          </Bars>
        )}
      </div>
    </Transition>
  );
};

export default Campaign;
