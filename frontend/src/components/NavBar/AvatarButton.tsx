import { Popover } from "@headlessui/react";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/20/solid";
import { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import tw, { styled } from "twin.macro";

import Transition from "components/Transition";

const ToggleButton = styled(Popover.Button, {
  ...tw`
    w-8 h-8 text-xs flex items-center justify-center
    bg-slate-500/10 text-violet-700 font-semibold
    rounded-full transition
    hover:bg-slate-500/20 focus:(outline-none ring ring-indigo-600/50)
  `,
});

const ItemButton = tw.button`
  px-2 py-1 flex items-center justify-end gap-1
  rounded-md
  hover:(bg-gray-50 text-indigo-700)
  focus-within:(outline-none ring ring-indigo-600/50)
`;

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
    ["name", "signup_token", "AUTH_TOKEN"].forEach((key) => {
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
          enter={tw`transition ease-out duration-200`}
          enterFrom={tw`opacity-0 -translate-y-1`}
          leave={tw`transition ease-in duration-150`}
          leaveTo={tw`opacity-0 translate-y-0.5`}
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
