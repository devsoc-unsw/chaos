import janeStreetLogo from "assets/LandingPage/janestreet.png";
import tiktokLogo from "assets/LandingPage/tiktok.svg";

import "twin.macro";

const SponsorLogos = () => (
  <div tw="translate-y-[100%] space-y-4 sm:translate-y-[200%]">
    <div tw="flex w-full flex-row flex-wrap items-center justify-start gap-x-4 gap-y-4">
      <h3 tw="text-left text-2xl">Sponsored by:</h3>
      <div tw="flex flex-row items-center gap-x-6 gap-y-4">
        <a href="https://www.janestreet.com">
          <img alt="jane st logo" src={janeStreetLogo} tw="min-w-32 max-w-48" />
        </a>
        <a href="https://www.tiktok.com">
          <img alt="tiktok logo" src={tiktokLogo} tw="min-w-32 max-w-40" />
        </a>
      </div>
    </div>
  </div>
);

export default SponsorLogos;
