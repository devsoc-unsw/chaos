import { forwardRef, useEffect, useState } from "react";
import PropTypes from "prop-types";
import tw, { styled } from "twin.macro";
import BezierEasing from "bezier-easing";

import { Transition } from "components";
import Campaign from "./Campaign";

import csesoc from "./CSESoc_logo.jpeg";
import compclub from "./compclub.png";

const Container = styled.div({
  ...tw`
    absolute top-1/2 right-[50px] w-[650px] h-[600px]
    flex items-center justify-center
    -translate-y-1/2 z-[-1]
  `,
  perspective: 700,
});

const Heading = tw.h1`font-bold text-3xl my-5 h-[1em] rounded-md bg-black/[0.15]`;
const Row = tw.div`flex gap-6`;

const DEFAULT_ROTATE_X = 6;
const DEFAULT_ROTATE_Y = -7.5;
const easing = BezierEasing(0.4, 0, 0.2, 1);

const Campaigns = forwardRef(({ offsetX, offsetY }, ref) => {
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
      return;
    }

    let cancel = false;
    let start;
    let previousTimestamp;
    const duration = 150;

    const step = (timestamp) => {
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

    // eslint-disable-next-line consistent-return
    return () => {
      cancel = true;
    };
  }, [withinRange]);

  rotateX = DEFAULT_ROTATE_X + multiplier * (rotateX - DEFAULT_ROTATE_X);
  rotateY = DEFAULT_ROTATE_Y + multiplier * (rotateY - DEFAULT_ROTATE_Y);

  return (
    <Container ref={ref}>
      <aside
        tw="flex flex-col gap-4 mt-[-50px]"
        css={!withinRange && tw`transition-transform duration-100`}
        style={{
          transform: `scale(0.7) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(1deg)`,
        }}
      >
        <section>
          <Transition
            as={Heading}
            appear
            enter={tw`transition-[width] duration-[600ms]`}
            enterFrom={tw`w-0`}
            enterTo={tw`w-72`}
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
            enter={tw`transition-[width] duration-[600ms] delay-[400ms]`}
            enterFrom={tw`w-0`}
            enterTo={tw`w-80`}
          />
          <Row>
            <Campaign logo={compclub} transitionDelay={600} />
            <Campaign logo={csesoc} transitionDelay={800} />
          </Row>
        </section>
      </aside>
    </Container>
  );
});

Campaigns.propTypes = {
  // eslint-disable-next-line react/require-default-props -- allow null
  offsetX: PropTypes.number,
  // eslint-disable-next-line react/require-default-props
  offsetY: PropTypes.number,
};

export default Campaigns;
