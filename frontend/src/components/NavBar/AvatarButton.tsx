import { Popover } from "@headlessui/react";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/20/solid";
import { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import tw, { styled } from "twin.macro";

import Transition from "components/Transition";

const ToggleButton = styled(Popover.Button, {
  ...tw`flex h-8 w-8 items-center justify-center rounded-full bg-slate-500/10 text-xs font-semibold text-violet-700 transition hover:bg-slate-500/20 focus:outline-none focus:ring focus:ring-indigo-600/50`,
});

const ItemButton = tw.button`flex items-center justify-end gap-1 rounded-md px-2 py-1 focus-within:outline-none focus-within:ring focus-within:ring-indigo-600/50 hover:bg-gray-50 hover:text-indigo-700`;

const AvatarButton = () => {
  const name = localStorage.getItem("name") ?? "";
  const initials = name
    .split(" ")
    // this non-exhaustively matches other latin alphabets, not just enligh
    // https://stackoverflow.com/a/32567789
    .map((n) => [...n].find((c) => c.toLowerCase() !== c.toUpperCase()) ?? n[0])
    .join("");

  const navigate = useNavigate();
  const logout = () => {
    ["name"].forEach((key) => {
      localStorage.removeItem(key);
      navigate("/");
    });
  };

  return (
    <Popover tw="relative">
      <>
        <ToggleButton>{initials}</ToggleButton>
        <Transition
          as={Fragment}
          enter={tw`transition duration-200 ease-out`}
          enterFrom={tw`-translate-y-1 opacity-0`}
          leave={tw`transition duration-150 ease-in`}
          leaveTo={tw`translate-y-0.5 opacity-0`}
        >
          <Popover.Panel tw="absolute right-0 top-11 flex w-max flex-col overflow-hidden rounded bg-white shadow-md">
            <div tw="bg-gray-50 px-4 py-2 text-gray-500">
              Logged in as <span tw="text-indigo-600">{name}</span>
            </div>
            <div tw="flex flex-col gap-1 px-2 py-2 text-gray-600">
              <ItemButton onClick={logout}>
                Logout <ArrowRightOnRectangleIcon tw="inline h-4 w-4" />
              </ItemButton>
            </div>
          </Popover.Panel>
        </Transition>
      </>
    </Popover>
  );
};

export default AvatarButton;
