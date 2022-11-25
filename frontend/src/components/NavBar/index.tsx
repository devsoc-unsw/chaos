import { Link, NavLink } from "react-router-dom";
import tw, { styled } from "twin.macro";

import chaosImg from "assets/chaos.png";
import Container from "components/Container";

import { isLoggedIn } from "../../utils";

import AvatarButton from "./AvatarButton";

const NavButton = styled(NavLink, {
  ...tw`relative rounded px-2 py-1 text-slate-800`,
  ...tw`ring-blue-400 transition-shadow focus-visible:(outline-none ring)`,

  "&.active": tw`rounded from-blue-700/20 to-indigo-700/20 shadow bg-gradient-to-r`,

  "&:not(.active)": tw`
    before:(
      absolute inset-0
      from-blue-700 to-indigo-700 bg-gradient-to-r
      rounded opacity-0 transition-opacity duration-100
    )
    hover:before:opacity-[0.075]
  `,
});

const NavBar = ({ campaign }: { campaign: string }) => {
  const loggedIn = isLoggedIn();

  return (
    <header tw="fixed inset-x-0 z-10 bg-white shadow-md bg-gradient-to-r from-[#9dbbfb55] to-[#a78bfa55]">
      <Container tw="flex-row items-center gap-4 text-[hsl(255.1,30%,22%)]">
        <Link
          to="/"
          tw="-my-2 rounded py-2 transition-shadow focus-visible:(outline-none ring ring-blue-400)"
        >
          <img tw="h-7 drop-shadow filter" src={chaosImg} alt="Chaos" />
        </Link>
        {campaign || "Chaos"}
        <div tw="ml-auto flex items-center text-slate-600">
          <div tw="flex gap-1 pr-4 text-slate-900">
            {loggedIn && (
              <>
                <NavButton to="/dashboard">Dashboard</NavButton>
                <NavButton to="/admin">Admin</NavButton>
              </>
            )}
            <NavButton to="/about">About</NavButton>
          </div>
          <div tw="flex items-center gap-4">
            <span tw="border-slate-500 border-l">&#x200b;</span>
            {loggedIn ? (
              <AvatarButton />
            ) : (
              <a
                tw="rounded bg-indigo-400/30 px-3 py-1.5 text-black shadow transition-colors hover:bg-indigo-400/[0.42]"
                href={import.meta.env.VITE_OAUTH_CALLBACK_URL as string}
              >
                Get Started
              </a>
            )}
          </div>
        </div>
      </Container>
    </header>
  );
};

export default NavBar;
