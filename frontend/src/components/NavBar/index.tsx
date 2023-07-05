import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { useContext, useState } from "react";
import { NavLink, Link as RouterLink } from "react-router-dom";
import tw, { styled } from "twin.macro";

import chaosImg from "assets/chaos.png";
import Container from "components/Container";
import Link from "components/Link";
import Modal from "components/Modal";
import { LoggedInContext } from "contexts/LoggedInContext";

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

const NavBar = ({
  campaign,
  loggedIn,
}: {
  campaign: string;
  loggedIn: boolean;
}) => {
  const [aboutOpen, setAboutOpen] = useState(false);
  const setLoggedIn = useContext(LoggedInContext);

  setLoggedIn(isLoggedIn());

  return (
    <header tw="fixed inset-x-0 z-10 bg-white shadow-md bg-gradient-to-r from-[#9dbbfb55] to-[#a78bfa55]">
      <Container tw="flex-row items-center gap-4 text-[hsl(255.1,30%,22%)]">
        <RouterLink
          to={loggedIn ? "/dashboard" : "/"}
          tw="-my-2 rounded py-2 transition-shadow focus-visible:(outline-none ring ring-blue-400)"
        >
          <img tw="h-7 drop-shadow filter" src={chaosImg} alt="Chaos" />
        </RouterLink>
        {campaign || "Chaos"}
        <div tw="ml-auto flex items-center text-slate-600">
          <div tw="flex items-center gap-1 pr-2">
            {loggedIn && (
              <>
                <NavButton to="/dashboard">Dashboard</NavButton>
                <NavButton to="/admin">Admin</NavButton>
              </>
            )}
            <button
              tw="p-1 text-slate-800 rounded-full transition hover:(bg-slate-500/10 text-slate-900)"
              type="button"
              onClick={() => setAboutOpen(true)}
            >
              <InformationCircleIcon tw="h-6 w-6" />
              <span tw="sr-only">About Chaos</span>
            </button>
          </div>
          <div tw="flex items-center gap-4">
            <span tw="border-slate-500 border-l">&#x200b;</span>
            {loggedIn ? (
              <AvatarButton onLogout={() => setLoggedIn(false)} />
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
      <Modal
        open={aboutOpen}
        closeModal={() => setAboutOpen(false)}
        closeButton
        title="About Chaos"
        description="Simplifying recruitment"
      >
        <p>
          Chaos is a platform for simplifying applying and recruiting for
          student society subcommittees at UNSW.
        </p>

        <p>
          It was created by CSESoc Projects – a place for student-led projects
          where you can learn something new, and make some friends along the
          way. Chaos is free and{" "}
          <Link
            href="https://github.com/csesoc/chaos"
            target="_blank"
            rel="noreferrer"
          >
            open-source.
          </Link>
        </p>
      </Modal>
    </header>
  );
};

export default NavBar;
