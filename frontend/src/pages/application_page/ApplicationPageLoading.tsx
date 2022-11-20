import tw from "twin.macro";

import Card from "components/Card";
import Container from "components/Container";
import NavCard from "components/NavCard";
import PulsingBar from "components/PulsingBar";

const NUM_SECTIONS = 2;
const NUM_QUESTIONS = 2;
const lineStyles = [tw`w-96`, tw`w-80`, tw`w-64`, tw`w-48`];
const LINE_DELAY = 50;
const SECTION_DELAY = NUM_QUESTIONS * (lineStyles.length * LINE_DELAY);
const QUESTION_DELAY = lineStyles.length * LINE_DELAY;

const Group = tw.div`flex flex-col gap-1.5 mt-2`;

const ApplicationPageLoading = () => (
  <Container tw="gap-4">
    <Card tw="items-center gap-6 md:flex-row">
      <article tw="flex flex-col w-full gap-2">
        <div tw="flex items-center gap-2">
          <PulsingBar tw="w-20 h-20 rounded shadow-md" standalone />
          <div tw="flex flex-col justify-center gap-2">
            <PulsingBar tw="h-6! w-32" />
            <PulsingBar tw="h-4! w-48" animationDelay={100} />
          </div>
        </div>

        <Group>
          <PulsingBar tw="w-80" animationDelay={200} />
          <PulsingBar tw="w-96" animationDelay={300} />
          <PulsingBar tw="w-56" animationDelay={400} />
        </Group>

        <Group>
          <PulsingBar tw="h-4 w-52" animationDelay={500} />
          <PulsingBar tw="w-72" animationDelay={600} />
          <PulsingBar tw="w-64" animationDelay={700} />
        </Group>
      </article>

      <div tw="w-full max-w-lg">
        <PulsingBar tw="shadow-md aspect-w-16 aspect-h-9 bg-[#edeeef]!" />
      </div>
    </Card>

    <div tw="flex flex-1 gap-4">
      <NavCard
        title={<PulsingBar tw="h-6 w-28" animationDelay={800} standalone />}
      >
        <div tw="flex flex-col gap-1.5">
          <PulsingBar tw="h-4 w-52" animationDelay={900} />
          <PulsingBar tw="h-4 w-36" animationDelay={1000} />
          <PulsingBar tw="h-4 w-28" animationDelay={1100} />
          <PulsingBar tw="h-4 w-44" animationDelay={1200} />
          <PulsingBar tw="h-4 w-20" animationDelay={1300} />
          <PulsingBar tw="h-4 w-32" animationDelay={1400} />
        </div>
      </NavCard>

      <Card tw="flex-1">
        <PulsingBar tw="h-6 w-32 mb-2" />
        {Array(NUM_SECTIONS)
          .fill(null)
          .map((_, i) => (
            <section tw="my-4 flex flex-col gap-1">
              <PulsingBar
                tw="h-4 w-72"
                animationDelay={100 + i * SECTION_DELAY}
              />
              <div tw="flex flex-col gap-2">
                {Array(NUM_QUESTIONS)
                  .fill(null)
                  .map((_, j) => (
                    <div tw="mt-2 flex flex-col gap-1.5">
                      {lineStyles.map((css, k) => (
                        <PulsingBar
                          tw="first:bg-black/10!"
                          css={css}
                          animationDelay={
                            100 +
                            i * SECTION_DELAY +
                            j * QUESTION_DELAY +
                            k * LINE_DELAY
                          }
                        />
                      ))}
                    </div>
                  ))}
              </div>
            </section>
          ))}
      </Card>
    </div>
  </Container>
);

export default ApplicationPageLoading;
