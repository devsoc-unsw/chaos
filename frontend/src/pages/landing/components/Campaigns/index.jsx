import tw, { styled } from "twin.macro";

import Campaign from "./Campaign";
import { Transition } from "components";

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

const Campaigns = ({ offsetX, offsetY }) => {
  const rotateX = 6 - offsetY;
  const rotateY = -7.5 + offsetX;
  return (
    <Container>
      <aside
        tw="flex flex-col gap-4 mt-[-50px]"
        style={{
          transform: `scale(0.7) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(1deg)`,
        }}
      >
        <section>
          <Transition
            as={Heading}
            appear={true}
            enter={tw`transition-[width] duration-[600ms]`}
            enterFrom={tw`w-0`}
            enterTo={tw`w-[275px]`}
          />
          <Row>
            <Campaign logo={csesoc} active={true} />
            <Campaign logo={compclub} active={true} transitionDelay={200} />
          </Row>
        </section>
        <section>
          <Transition
            as={Heading}
            appear={true}
            enter={tw`transition-[width] duration-[600ms] delay-[400ms]`}
            enterFrom={tw`w-0`}
            enterTo={tw`w-[325px]`}
          />
          <Row>
            <Campaign logo={compclub} transitionDelay={600} />
            <Campaign logo={csesoc} transitionDelay={800} />
          </Row>
        </section>
      </aside>
    </Container>
  );
};

export default Campaigns;
