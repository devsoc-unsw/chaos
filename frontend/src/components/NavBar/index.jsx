import React from "react";
import tw, { styled } from "twin.macro";
import PropTypes from "prop-types";
import { Link, NavLink } from "react-router-dom";
import { isLoggedIn } from "../../utils";

const NavButton = styled(NavLink, {
  ...tw`px-2 py-1 text-slate-800 relative`,

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

  return (
    <header tw="fixed inset-x-0 bg-white py-4 shadow-md bg-gradient-to-r from-[#9dbbfb55] to-[#a78bfa55]">
      <div tw="mx-auto max-w-7xl px-4 flex gap-4 items-center text-[hsl(255.1,30%,22%)]">
        <Link to="/">
          <img
            tw="h-7 filter drop-shadow"
            src="https://chaos-landing.pages.dev/assets/chaos.cea10b79.png"
            alt="Chaos"
          />
        </Link>
        {campaign || "Chaos"}
        <div tw="ml-auto flex items-center text-slate-600">
          <ul tw="flex gap-2 pr-4 text-slate-900">
            <NavButton to="/dashboard" active>
              Dashboard
            </NavButton>
            <NavButton to="/admin">Admin</NavButton>
            <NavButton to="/about">About</NavButton>
          </ul>
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
          <button tw="ml-3 text-slate-500 hover:text-indigo-600 transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              tw="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

NavBar.propTypes = {
  campaign: PropTypes.string.isRequired,
};

export default NavBar;
