import { Fragment, useContext, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import tw from "twin.macro";

import chaosImg from "assets/chaos.png";
import { Transition } from "components";
import Container from "components/Container";
import { SetNavBarTitleContext } from "contexts/SetNavbarTitleContext";

import { getStore } from "../../utils";

import Campaigns from "./components/Campaigns";
import DashboardButton from "./components/DashboardButton";
import SponsorLogos from "./components/SponsorLogos";
import Waves from "./components/Waves";

import type { PointerEvent } from "react";

const OAUTH_CALLBACK_URL =
  getStore("AUTH_TOKEN") || (import.meta.env.VITE_OAUTH_CALLBACK_URL as string);

const Landing = () => {
  const setNavBarTitle = useContext(SetNavBarTitleContext);
  useEffect(() => {
    setNavBarTitle("");
  }, []);

  const campaignsRef = useRef<HTMLDivElement>(null);

  const [offsetX, setOffsetX] = useState<number>(Infinity);
  const [offsetY, setOffsetY] = useState<number>(Infinity);
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const div = campaignsRef.current;
    if (div === null) {
      return;
    }
    const { top, left } = div.getBoundingClientRect();
    setOffsetX((e.clientX - (left + div.clientWidth / 2)) / 40);
    setOffsetY((e.clientY - (top + div.clientHeight / 2)) / 40);
  };

  return (
    <div tw="flex flex-1 flex-row justify-center" onPointerMove={onPointerMove}>
      <Container tw="my-auto translate-y-[-100px] p-12">
        <main tw="[& > *]:w-fit [& > *]:pointer-events-auto pointer-events-none w-fit font-light">
          <Transition
            appear
            show
            enter={tw`transition duration-[600ms]`}
            enterFrom={tw`-translate-x-6 opacity-0`}
          >
            <h1 tw="text-5xl">
              <img
                tw="inline h-[1em] drop-shadow-md filter"
                src={chaosImg}
                alt="Chaos Logo"
              />{" "}
              Chaos
            </h1>
          </Transition>
          <Transition
            as={Fragment}
            appear
            show
            enter={tw`transition duration-[600ms] delay-[250ms]`}
            enterFrom={tw`translate-y-4 opacity-0`}
            enterTo={tw`text-2xl`}
          >
            <h2 tw="my-4 text-3xl">Recruitment drives, without the chaos.</h2>
          </Transition>
          <Transition
            appear
            show
            enter={tw`transition delay-500 duration-[600ms]`}
            enterFrom={tw`translate-y-4 opacity-0`}
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
          <Transition
            show
            appear
            enter={tw`transition delay-[750ms] duration-[800ms]`}
            enterFrom={tw`translate-y-4 opacity-0`}
          >
            <SponsorLogos />
          </Transition>
        </main>
        <Campaigns ref={campaignsRef} offsetX={offsetX} offsetY={offsetY} />
      </Container>
      <Waves />
    </div>
  );
};

export default Landing;
