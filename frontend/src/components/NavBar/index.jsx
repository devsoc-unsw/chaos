import React from "react";
import tw, { styled } from "twin.macro";
import PropTypes from "prop-types";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/solid";
import { isLoggedIn } from "../../utils";

import chaosImg from "assets/chaos.png";

const NavButton = styled(NavLink, {
  ...tw`
    relative px-2 py-1 text-slate-800 rounded
    transition-shadow ring-blue-400 focus-visible:(ring outline-none)
  `,

  "&.active": tw`rounded shadow bg-gradient-to-r to-indigo-700/20 from-blue-700/20`,
  "&:not(.active)": tw`before:(
      absolute inset-0
      bg-gradient-to-r from-blue-700 to-indigo-700
      rounded transition-opacity duration-100 opacity-0
    )
    hover:before:opacity-[0.075]
  `,
});

const NavBar = ({ campaign }) => {
  const loggedIn = isLoggedIn();
  const navigate = useNavigate();

  const logout = () => {
    ["name", "signup_token", "AUTH_TOKEN"].forEach((key) => {
      localStorage.removeItem(key);
      navigate("/");
    });
  };

  return (
    <header tw="fixed inset-x-0 bg-white py-4 shadow-md bg-gradient-to-r from-[#9dbbfb55] to-[#a78bfa55]">
      <div tw="mx-auto max-w-7xl px-4 flex gap-4 items-center text-[hsl(255.1,30%,22%)]">
        <Link
          to="/"
          tw="py-2 -my-2 rounded transition-shadow focus-visible:(ring ring-blue-400 outline-none)"
        >
          <img tw="h-7 filter drop-shadow" src={chaosImg} alt="Chaos" />
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
              <span tw="border-l border-slate-500 pl-4">
                Hi,{" "}
                <span tw="text-indigo-600 font-normal">
                  {localStorage.getItem("name")}
                </span>
                !
              </span>
              {/*<img
                tw="w-8 ml-2 h-auto rounded-full bg-black/10"
                src="https://static-cdn.jtvnw.net/jtv_user_pictures/103727a4-bb19-497d-a4b5-02ccd17efa64-profile_image-300x300.png"
                alt="Michael"
              />*/}
              <button
                tw="ml-3 p-1 text-slate-500 hover:text-indigo-600 transition rounded-full focus-visible:(ring ring-blue-400 outline-none)"
                onClick={logout}
              >
                <ArrowRightOnRectangleIcon tw="h-6 w-6" />
              </button>
            </>
          ) : (
            <span tw="border-l border-slate-500 pl-4">
              <a
                tw="px-3 py-1.5 rounded shadow bg-indigo-400/30 text-black hover:bg-indigo-400/[0.42] transition-colors"
                href={import.meta.env.VITE_OAUTH_CALLBACK_URL}
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

NavBar.propTypes = {
  campaign: PropTypes.string.isRequired,
};

export default NavBar;
