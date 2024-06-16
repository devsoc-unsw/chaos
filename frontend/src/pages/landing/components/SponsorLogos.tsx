import janeStreetLogo from "assets/LandingPage/janestreet.png";
import tiktokLogo from "assets/LandingPage/tiktok.svg";

import "twin.macro";

const SponsorLogos = () => (
  <div tw="space-y-4 translate-y-[100%] sm:translate-y-[200%]">
    <div tw="flex flex-row flex-wrap justify-start gap-y-4 gap-x-4 w-full items-center">
      <h3 tw="text-2xl text-left">Sponsored by:</h3>
      <div tw="flex flex-row gap-x-6 gap-y-4 items-center">
        <a href="https://www.janestreet.com">
          <img alt="jane st logo" src={janeStreetLogo} tw="max-w-48 min-w-32" />
        </a>
        <a href="https://www.tiktok.com">
          <img alt="tiktok logo" src={tiktokLogo} tw="max-w-40 min-w-32" />
        </a>
      </div>
    </div>
  </div>
);

export default SponsorLogos;
