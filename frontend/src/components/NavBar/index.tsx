import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { NavLink, Link as RouterLink } from "react-router-dom";
import tw, { styled } from "twin.macro";

import chaosImg from "assets/chaos.png";
import Container from "components/Container";
import Link from "components/Link";
import Modal from "components/Modal";

import { isLoggedIn } from "../../utils";

import AvatarButton from "./AvatarButton";

const NavButton = styled(NavLink, {
  ...tw`relative rounded px-2 py-1 text-slate-800`,
  ...tw`ring-blue-400 transition-shadow focus-visible:outline-none focus-visible:ring`,

  "&.active": tw`rounded bg-gradient-to-r from-blue-700/20 to-indigo-700/20 shadow`,

  "&:not(.active)": tw`before:absolute before:inset-0 before:rounded before:bg-gradient-to-r before:from-blue-700 before:to-indigo-700 before:opacity-0 before:transition-opacity before:duration-100 hover:before:opacity-[0.075]`,
});

const NavBar = ({ campaign }: { campaign: string }) => {
  const loggedIn = isLoggedIn();
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <header tw="fixed inset-x-0 z-10 bg-white bg-gradient-to-r from-[#9dbbfb55] to-[#a78bfa55] shadow-md">
      <Container tw="flex-row items-center gap-4 text-[hsl(255.1,30%,22%)]">
        <RouterLink
          to={loggedIn ? "/dashboard" : "/"}
          tw="-my-2 rounded py-2 transition-shadow focus-visible:outline-none focus-visible:ring focus-visible:ring-blue-400"
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
              tw="hover:(bg-slate-500/10 text-slate-900) rounded-full p-1 text-slate-800 transition"
              type="button"
              onClick={() => setAboutOpen(true)}
            >
              <InformationCircleIcon tw="h-6 w-6" />
              <span tw="sr-only">About Chaos</span>
            </button>
          </div>
          <div tw="flex items-center gap-4">
            <span tw="border-l border-slate-500">&#x200b;</span>
            {loggedIn ? (
              <AvatarButton />
            ) : (
              <a
                tw="rounded bg-indigo-400/30 px-3 py-1.5 text-black shadow transition-colors hover:bg-indigo-400/[0.42]"
                href={import.meta.env.VITE_OAUTH_CALLBACK_URL as string}
              >
                Get Started
              </a>
              // <p tw="rounded bg-indigo-400/30 px-3 py-1.5 text-black shadow transition-colors hover:bg-indigo-400/[0.42]">
              //   Coming Soon!
              // </p>
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
