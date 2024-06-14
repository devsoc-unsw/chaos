/* eslint-disable @typescript-eslint/restrict-template-expressions -- needed for target other components in stitches styles */
import { Fragment } from "react";
import toast from "react-hot-toast";
import tw, { styled } from "twin.macro";

import Transition from "./Transition";

import type { VariantProps } from "@stitches/react";
import type { Toast as ToastObject } from "react-hot-toast";

const ButtonContainer = styled("div", tw`border-l border-gray-200`);

const ToastContainer = styled("div", {
  ...tw`flex w-full max-w-md bg-white rounded border shadow`,

  variants: {
    type: {
      notification: {
        [`&, & ${ButtonContainer}`]: tw`border-gray-200`,
      },
      success: {
        [`&, & ${ButtonContainer}`]: tw`border-green-200`,
        "& h1": tw`text-green-600`,
      },
      error: {
        [`&, & ${ButtonContainer}`]: tw`border-red-200`,
        "& h1": tw`text-red-600`,
      },
    },
  },
});

export type ToastType = Extract<
  VariantProps<typeof ToastContainer>["type"],
  string
>;
type Props = {
  t: ToastObject;
  title: string;
  description: string;
  type?: ToastType;
};
const Toast = ({ t, title, description, type = "notification" }: Props) => (
  <Transition
    as={Fragment}
    show={t.visible}
    appear
    enter={tw`duration-200 ease-out`}
    enterFrom={tw`opacity-0 scale-95`}
    leave={tw`duration-150 ease-in`}
    leaveTo={tw`opacity-0 scale-95`}
  >
    <ToastContainer type={type}>
      <div tw="flex flex-1 flex-col px-4 py-3">
        <h1 tw="font-semibold">{title}</h1>
        <p tw="text-sm">{description}</p>
      </div>
      <ButtonContainer>
        <button
          type="button"
          tw="hover:(text-blue-700 bg-slate-50) focus-visible:(outline-none ring-blue-600) flex h-full w-12 items-center justify-center rounded-r px-8 py-3 text-sm font-medium text-blue-600 ring-2"
          onClick={() => toast.dismiss(t.id)}
        >
          Close
        </button>
      </ButtonContainer>
    </ToastContainer>
  </Transition>
);

export default Toast;
