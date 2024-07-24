import "twin.macro";

import Container from "components/Container";
import PulsingBar from "components/PulsingBar";
import CampaignLoading from "pages/dashboard/CampaignGrid/CampaignLoading";

const AdminLoading = () => (
  <div tw="flex flex-1">
    <div tw="flex w-24 flex-col items-center gap-4 bg-white p-4 shadow">
      {Array(4)
        .fill(null)
        .map((_, i) => (
          <PulsingBar
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            tw="h-16 w-16"
            standalone
            animationDelay={i * 100}
          />
        ))}
    </div>
    <Container tw="gap-8">
      <header tw="flex items-center justify-between">
        <div tw="flex items-center gap-4">
          <PulsingBar tw="h-24 w-24 shadow" />
          <PulsingBar tw="h-10 w-72" />
        </div>
        <div tw="flex gap-4">
          <PulsingBar tw="h-10 w-24 shadow" standalone />
          <PulsingBar tw="h-10 w-24 shadow" standalone />
          <PulsingBar tw="h-10 w-10 shadow" color="red" standalone />
        </div>
      </header>
      <div tw="flex flex-wrap justify-around gap-x-4 gap-y-8">
        {Array(5)
          .fill(null)
          .map((_, i) => (
            <CampaignLoading
              // eslint-disable-next-line react/no-array-index-key
              key={i}
              status="pending"
              animationDelay={i * 100}
            />
          ))}
      </div>
    </Container>
  </div>
);

export default AdminLoading;
