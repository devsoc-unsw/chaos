import BezierEasing from "bezier-easing";
import { forwardRef, useEffect, useState } from "react";
import tw, { styled } from "twin.macro";

import { Transition } from "components";

import csesoc from "./CSESoc_logo.jpeg";
import Campaign from "./Campaign";
import compclub from "./compclub.png";

const Container = styled.div({
  ...tw`
    absolute top-1/2 right-[50px] w-[650px] h-[600px]
    flex items-center justify-center
    -translate-y-1/2 z-[-1]
  `,
  perspective: 700,
});

const Heading = tw.h1`my-3 rounded bg-black/[0.15] font-bold text-xl h-[1em]`;
const Row = tw.div`flex gap-4`;

const DEFAULT_ROTATE_X = 7.5;
const DEFAULT_ROTATE_Y = -9;
const easing = BezierEasing(0.4, 0, 0.2, 1);

type Props = {
  offsetX: number;
  offsetY: number;
};
const Campaigns = forwardRef<HTMLDivElement, Props>(
  ({ offsetX, offsetY }, ref) => {
    const [multiplier, setMultiplier] = useState(0);

    const withinRange =
      offsetX !== null &&
      offsetY !== null &&
      Math.max(Math.abs(offsetX), Math.abs(offsetY)) < 8;

    let rotateX;
    let rotateY;
    if (!withinRange) {
      rotateX = DEFAULT_ROTATE_X;
      rotateY = DEFAULT_ROTATE_Y;
    } else {
      rotateX = -offsetY;
      rotateY = offsetX;
    }

    useEffect(() => {
      if (!withinRange) {
        setMultiplier(0);
        return undefined;
      }

      let cancel = false;
      let start: number | undefined;
      let previousTimestamp: number;
      const duration = 150;

      const step = (timestamp: number) => {
        if (start === undefined) {
          start = timestamp;
        }
        const elapsed = timestamp - start;

        if (previousTimestamp !== timestamp) {
          setMultiplier(Math.min(1, easing(elapsed / duration)));
        }

        if (elapsed >= duration || cancel) {
          return;
        }

        previousTimestamp = timestamp;
        window.requestAnimationFrame(step);
      };

      window.requestAnimationFrame(step);

      return () => {
        cancel = true;
      };
    }, [withinRange]);

    rotateX = DEFAULT_ROTATE_X + multiplier * (rotateX - DEFAULT_ROTATE_X);
    rotateY = DEFAULT_ROTATE_Y + multiplier * (rotateY - DEFAULT_ROTATE_Y);

    return (
      <Container ref={ref}>
        <aside
          tw="mt-[-50px] flex flex-col gap-3 text-xs"
          css={!withinRange ? tw`transition-transform duration-100` : undefined}
          style={{
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(1deg)`,
          }}
        >
          <section>
            <Transition
              as={Heading}
              appear
              show
              enter={tw`transition-[width] duration-[600ms]`}
              enterFrom={tw`w-0`}
              enterTo={tw`w-52`}
            />
            <Row>
              <Campaign logo={csesoc} active />
              <Campaign logo={compclub} active transitionDelay={200} />
            </Row>
          </section>
          <section>
            <Transition
              as={Heading}
              appear
              show
              enter={tw`transition-[width] duration-[600ms] delay-[400ms]`}
              enterFrom={tw`w-0`}
              enterTo={tw`w-56`}
            />
            <Row>
              <Campaign logo={compclub} transitionDelay={600} />
              <Campaign logo={csesoc} transitionDelay={800} />
            </Row>
          </section>
        </aside>
      </Container>
    );
  }
);

export default Campaigns;
