import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/solid";
import { Link, NavLink, useNavigate } from "react-router-dom";
import tw, { styled } from "twin.macro";

import chaosImg from "assets/chaos.png";

import { isLoggedIn } from "../../utils";

const NavButton = styled(NavLink, {
  ...tw`relative rounded px-2 py-1 text-slate-800`,
  ...tw`ring-blue-400 transition-shadow focus-visible:(outline-none ring)`,

  "&.active": tw`rounded from-blue-700/20 to-indigo-700/20 shadow bg-gradient-to-r`,

  // eslint-disable-next-line prettier/prettier
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
  const navigate = useNavigate();

  const logout = () => {
    ["name", "signup_token", "AUTH_TOKEN"].forEach((key) => {
      localStorage.removeItem(key);
      navigate("/");
    });
  };

  return (
    <header tw="fixed inset-x-0 z-10 bg-white py-4 shadow-md bg-gradient-to-r from-[#9dbbfb55] to-[#a78bfa55]">
      <div tw="mx-auto flex max-w-7xl items-center gap-4 px-4 text-[hsl(255.1,30%,22%)]">
        <Link
          to="/"
          tw="-my-2 rounded py-2 transition-shadow focus-visible:(outline-none ring ring-blue-400)"
        >
          <img tw="h-7 drop-shadow filter" src={chaosImg} alt="Chaos" />
        </Link>
        {campaign || "Chaos"}
        <div tw="ml-auto flex items-center text-slate-600">
          <div tw="flex gap-2 pr-4 text-slate-900">
            {loggedIn && (
              <>
                <NavButton to="/dashboard">Dashboard</NavButton>
                <NavButton to="/admin">Admin</NavButton>
              </>
            )}
            <NavButton to="/about">About</NavButton>
          </div>
          {loggedIn ? (
            <>
              <span tw="border-slate-500 border-l pl-4">
                Hi,{" "}
                <span tw="font-normal text-indigo-600">
                  {localStorage.getItem("name")}
                </span>
                !
              </span>
              {/* <img
                tw="w-8 ml-2 h-auto rounded-full bg-black/10"
                src="https://static-cdn.jtvnw.net/jtv_user_pictures/103727a4-bb19-497d-a4b5-02ccd17efa64-profile_image-300x300.png"
                alt="Michael"
              /> */}
              <button
                tw="ml-3 rounded-full p-1 text-slate-500 transition hover:text-indigo-600 focus-visible:(outline-none ring ring-blue-400)"
                onClick={logout}
                type="button"
              >
                <ArrowRightOnRectangleIcon tw="h-6 w-6" />
              </button>
            </>
          ) : (
            <span tw="border-slate-500 border-l pl-4">
              <a
                tw="rounded bg-indigo-400/30 px-3 py-1.5 text-black shadow transition-colors hover:bg-indigo-400/[0.42]"
                href={import.meta.env.VITE_OAUTH_CALLBACK_URL as string}
              >
                Get Started
              </a>
            </span>
          )}
        </div>
      </div>
    </header>
  );
};

export default NavBar;
