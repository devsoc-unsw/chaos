import React, { useContext, useState, useEffect, Fragment } from "react";
import tw from "twin.macro";
import { Link } from "react-router-dom";
import { SetNavBarTitleContext } from "contexts/SetNavbarTitleContext";
import { getStore } from "../../utils";
import Campaigns from "./components/Campaigns";
import DashboardButton from "./components/DashboardButton";
import Waves from "./components/Waves";
import { Transition } from "components";

import chaosImg from "assets/chaos.png";

const OAUTH_CALLBACK_URL =
  getStore("AUTH_TOKEN") || import.meta.env.VITE_OAUTH_CALLBACK_URL;

const Landing = () => {
  const setNavBarTitle = useContext(SetNavBarTitleContext);
  useEffect(() => {
    setNavBarTitle("");
  }, []);

  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const onPointerMove = (e) => {
    const div = e.currentTarget;
    setOffsetX((e.clientX - (div.offsetLeft + div.clientWidth / 2)) / 100);
    setOffsetY((e.clientY - (div.offsetTop + div.clientHeight / 2)) / 100);
  };

  return (
    <div
      tw="flex flex-col items-center min-h-screen w-full font-light font-sans bg-gray-50"
      onPointerMove={onPointerMove}
    >
      <div tw="flex w-full p-[50px] max-w-7xl my-auto translate-y-[-100px]">
        <main>
          <Transition
            appear={true}
            enter={tw`transition duration-[600ms]`}
            enterFrom={tw`opacity-0 -translate-x-6`}
          >
            <h1 tw="text-5xl">
              <img
                tw="inline h-[1em] filter drop-shadow-md"
                src={chaosImg}
                alt="Chaos Logo"
              />{" "}
              Chaos
            </h1>
          </Transition>
          <Transition
            as={Fragment}
            appear={true}
            enter={tw`transition duration-[600ms] delay-[250ms]`}
            enterFrom={tw`opacity-0 translate-y-4`}
            enterTo={tw`text-2xl`}
          >
            <h2 tw="text-3xl my-4">Recruitment Drives, without the fuss.</h2>
          </Transition>
          <Transition
            appear={true}
            enter={tw`transition duration-[600ms] delay-500`}
            enterFrom={tw`opacity-0 translate-y-4`}
          >
            {getStore("AUTH_TOKEN") ? (
              <DashboardButton as={Link} to="/dashboard">
                Your Dashboard
              </DashboardButton>
            ) : (
              <DashboardButton as="a" href={OAUTH_CALLBACK_URL}>
                Get Started
              </DashboardButton>
            )}
          </Transition>
        </main>
        <Campaigns offsetX={offsetX} offsetY={offsetY} />
      </div>

      <Waves />
    </div>
  );
};

export default Landing;
