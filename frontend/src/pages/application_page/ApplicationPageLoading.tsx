import tw from "twin.macro";

import Card from "components/Card";
import Container from "components/Container";
import NavCard from "components/NavCard";
import PulsingBar from "components/PulsingBar";

import type { TwStyle } from "twin.macro";

const NUM_SECTIONS = 2;
const NUM_QUESTIONS = 2;
const lineStyles = [tw`w-96`, tw`w-80`, tw`w-64`, tw`w-48`];
const LINE_DELAY = 50;
const SECTION_DELAY = NUM_QUESTIONS * (lineStyles.length * LINE_DELAY);
const QUESTION_DELAY = lineStyles.length * LINE_DELAY;

const descriptionStyles = [tw`w-80`, tw`w-96`, tw`w-56`];
const userInfoStyles = [tw`h-4 w-52`, tw`w-72`, tw`w-64`];

const descLen = descriptionStyles.length + 1;
const infoLen = descLen + userInfoStyles.length;

type BarsProps = {
  styles: TwStyle[];
  commonStyles?: TwStyle;
  animationDelay?: number;
  individualDelay?: number;
};
const Bars = ({
  styles,
  commonStyles,
  animationDelay = 0,
  individualDelay = 100,
}: BarsProps) => (
  <div tw="flex flex-col gap-1.5">
    {styles.map((css, i) => (
      <PulsingBar
        // eslint-disable-next-line react/no-array-index-key
        key={i}
        css={{ ...commonStyles, ...css }}
        animationDelay={animationDelay + i * individualDelay}
      />
    ))}
  </div>
);

const ApplicationPageLoading = () => (
  <Container tw="gap-4">
    <Card tw="items-center gap-6 md:flex-row">
      <article tw="flex w-full flex-col gap-4">
        <div tw="flex items-center gap-2">
          <PulsingBar tw="h-20 w-20 rounded shadow-md" standalone />
          <div tw="flex flex-col justify-center gap-2">
            <PulsingBar tw="h-6! w-32" />
            <PulsingBar tw="h-4! w-48" animationDelay={100} />
          </div>
        </div>

        <Bars styles={descriptionStyles} animationDelay={100} />
        <Bars styles={userInfoStyles} animationDelay={descLen * 100} />
      </article>

      <div tw="w-full max-w-lg">
        <PulsingBar tw="bg-[#edeeef]! aspect-h-9 aspect-w-16 shadow-md" />
      </div>
    </Card>

    <div tw="flex flex-1 gap-4">
      <NavCard
        title={
          <PulsingBar tw="h-6 w-28" animationDelay={infoLen * 100} standalone />
        }
      >
        <Bars
          styles={[tw`w-52`, tw`w-36`, tw`w-28`, tw`w-44`, tw`w-20`, tw`w-32`]}
          commonStyles={tw`h-4`}
          animationDelay={infoLen * 100}
        />
      </NavCard>

      <Card tw="flex-1">
        <PulsingBar tw="mb-2 h-6 w-32" />
        {Array.from(Array(NUM_SECTIONS)).map((_, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <section key={i} tw="my-4 flex flex-col gap-4">
            <PulsingBar
              tw="h-4 w-72"
              animationDelay={100 + i * SECTION_DELAY}
            />
            <div tw="flex flex-col gap-4">
              {Array.from(Array(NUM_QUESTIONS)).map((_, j) => (
                <Bars
                  // eslint-disable-next-line react/no-array-index-key
                  key={j}
                  styles={lineStyles}
                  commonStyles={tw`first:bg-black/10!`}
                  animationDelay={100 + i * SECTION_DELAY + j * QUESTION_DELAY}
                  individualDelay={LINE_DELAY}
                />
              ))}
            </div>
          </section>
        ))}
      </Card>
    </div>
  </Container>
);

export default ApplicationPageLoading;
