import { Dialog } from "@headlessui/react";
import { Fragment } from "react";
import tw from "twin.macro";

import Transition from "components/Transition";

import type { ComponentProps, PropsWithChildren } from "react";

const Body = tw.div`mt-2 flex flex-col gap-2`;

type Props = {
  open: boolean;
  closeModal: () => void;
  title: string;
  description?: string;
} & ComponentProps<typeof Body>;
const Modal = ({
  open,
  closeModal,
  title,
  description,
  children,
  ...props
}: PropsWithChildren<Props>) => (
  <Transition appear show={open} as={Fragment}>
    <Dialog tw="relative z-10" onClose={closeModal}>
      <Transition.Child
        as={Fragment}
        enter={tw`duration-300 ease-out`}
        enterFrom={tw`opacity-0`}
        enterTo={tw`opacity-100`}
        leave={tw`duration-200 ease-in`}
        leaveFrom={tw`opacity-100`}
        leaveTo={tw`opacity-0`}
      >
        <div tw="fixed inset-0 bg-black/25 transition-opacity" />
      </Transition.Child>

      <div tw="fixed inset-0 overflow-y-auto">
        <div tw="flex min-h-full items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter={tw`duration-300 ease-out`}
            enterFrom={tw`translate-y-2 scale-95 opacity-0`}
            leave={tw`duration-200 ease-in`}
            leaveFrom={tw`scale-100 opacity-100`}
            leaveTo={tw`translate-y-2 scale-95 opacity-0`}
          >
            <Dialog.Panel tw="w-full max-w-lg transform overflow-hidden rounded bg-white p-4 shadow-xl transition-[opacity,transform]">
              <Dialog.Title
                as="h3"
                tw="font-medium text-2xl text-gray-900 leading-8"
              >
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description tw="text-sm text-gray-600">
                  {description}
                </Dialog.Description>
              )}
              <Body {...props}>{children}</Body>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </div>
    </Dialog>
  </Transition>
);

export default Modal;
