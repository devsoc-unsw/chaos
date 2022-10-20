import { Dialog } from "@headlessui/react";
import { Fragment } from "react";
import tw from "twin.macro";

import Transition from "components/Transition";

import type { PropsWithChildren } from "react";

type Props = {
  open: boolean;
  closeModal: () => void;
  title: string;
  description?: string;
};
const Modal = ({
  open,
  closeModal,
  title,
  description,
  children,
}: PropsWithChildren<Props>) => (
  <Transition appear show={open} as={Fragment}>
    <Dialog as="div" tw="relative z-10" onClose={closeModal}>
      <Transition.Child
        as={Fragment}
        enter={tw`ease-out duration-300`}
        enterFrom={tw`opacity-0`}
        enterTo={tw`opacity-100`}
        leave={tw`ease-in duration-200`}
        leaveFrom={tw`opacity-100`}
        leaveTo={tw`opacity-0`}
      >
        <div tw="fixed inset-0 bg-black/25 transition-opacity" />
      </Transition.Child>

      <div tw="fixed inset-0 overflow-y-auto">
        <div tw="flex min-h-full items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter={tw`ease-out duration-300`}
            enterFrom={tw`opacity-0 scale-95`}
            leave={tw`ease-in duration-200`}
            leaveFrom={tw`opacity-100 scale-100`}
            leaveTo={tw`opacity-0 scale-95`}
          >
            <Dialog.Panel tw="w-full max-w-md p-6 rounded bg-white shadow-xl overflow-hidden transform transition-[opacity,transform]">
              <Dialog.Title
                as="h3"
                tw="text-lg font-medium leading-6 text-gray-900"
              >
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description>{description}</Dialog.Description>
              )}
              <div tw="mt-2">{children}</div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </div>
    </Dialog>
  </Transition>
);

export default Modal;
