import { InformationCircleIcon } from "@heroicons/react/24/outline";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import {
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  Collapse,
  Divider,
  List,
  ListItem,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import moment from "moment";
import { useState } from "react";
import { Link } from "react-router-dom";
import tw, { styled } from "twin.macro";

import { ExpandIconButton } from "./campaignCard.styled";

import type { VariantProps } from "@stitches/react";
import type { ComponentProps, PropsWithChildren, ReactElement } from "react";
import type { ApplicationStatus, CampaignWithRoles } from "types/api";

type Status = {
  title: string;
  color: ComponentProps<typeof Chip>["color"];
  icon: ReactElement;
};
const statuses: { [status in ApplicationStatus]: Status } = {
  Draft: {
    title: "Draft",
    color: "default",
    icon: <MoreHorizIcon />,
  },
  Pending: {
    title: "Processing application",
    color: "warning",
    icon: <MoreHorizIcon />,
  },
  Success: {
    title: "Position offered",
    color: "success",
    icon: <CheckIcon />,
  },
  Rejected: {
    title: "Application rejected",
    color: "error",
    icon: <CloseIcon />,
  },
};

const StatusIndicator = ({
  children,
  ...props
}: PropsWithChildren<ComponentProps<"div">>) => (
  // TODO: open roles popup on click
  // TODO: i really do not like this, is there a better way to do it?
  // eslint-disable-next-line react/jsx-props-no-spreading
  <div {...props}>
    <InformationCircleIcon tw="h-5 w-5" />
    {children}
  </div>
);

const CampaignStatus = styled(StatusIndicator, {
  ...tw`px-2 py-1.5 flex items-center gap-1 ml-auto rounded-[0.2rem] text-white`,

  variants: {
    status: {
      pending: tw`bg-[hsl(220, 60%, 90%)] text-black`,
      open: tw`bg-[hsl(220, 93%, 60%)]`,
      closed: tw`hidden`,
      offered: tw`bg-green-300 text-green-900`,
      rejected: tw`bg-red-300 text-red-900`,
    },
  },

  defaultVariants: {
    status: "open",
  },
});

const dateToString = (date: Date) => moment(date).format("D MMM YYYY");

type Props = {
  campaignId?: number;
  organisationLogo: string;
  title: string;
  appliedFor: CampaignWithRoles["applied_for"];
  positions: { id: number | string; name: string; number: number }[];
  startDate: Date;
  endDate: Date;
  img: string;
  applyClick: () => void;
};

const CampaignCard = ({
  campaignId,
  organisationLogo,
  title,
  appliedFor,
  positions,
  startDate,
  endDate,
  img,
  applyClick,
}: Props) => {
  const [expanded, setExpanded] = useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  console.log(appliedFor);

  const positionsMap = Object.fromEntries(
    positions.map(({ id, ...position }) => [id, position])
  );
  const appliedForPositions = appliedFor.map(([id, status]) => {
    const position = positionsMap[id];
    return { position: position.name, status: statuses[status] };
  });

  const date = new Date();
  let status: VariantProps<typeof CampaignStatus>["status"];
  if (appliedFor.some(([_, status]) => status === "Success")) {
    status = "offered";
  } else if (appliedFor.some(([_, status]) => status === "Rejected")) {
    status = "rejected";
  } else if (date > endDate) {
    status = "closed";
  } else if (appliedFor.length) {
    status = "pending";
  } else {
    status = "open";
  }

  const content = (
    <div tw="w-96 bg-white text-sm rounded shadow-md overflow-hidden transition hover:(-translate-y-1 shadow-lg)">
      <header tw="flex items-center gap-1.5 p-3">
        <img
          tw="w-10 h-10 rounded-sm"
          src={organisationLogo}
          alt="Organisation"
        />
        <div tw="flex flex-col">
          <p>{title}</p>
          <p tw="text-gray-500">
            {dateToString(startDate)} - {dateToString(endDate)}
          </p>
        </div>
        <CampaignStatus status={status}>{status.toUpperCase()}</CampaignStatus>
      </header>
      <div
        tw="grid place-items-center bg-[#edeeef]"
        css={{ aspectRatio: "16/9" }}
      >
        <img
          tw="w-full max-h-full object-contain"
          src={img}
          alt="Campaign Cover"
        />
      </div>
    </div>
  );

  if (campaignId === undefined) {
    return content;
  }

  return <Link to={`/application/${campaignId}`}>{content}</Link>;

  return (
    <Card>
      <CardActionArea>
        <CardMedia
          component="img"
          height="140"
          image={img}
          alt={`campaign cover for ${title}`}
        />
        <CardContent>
          <Typography variant="overline" display="block">
            {`${startDate} - ${endDate}`}
          </Typography>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          {appliedFor.length > 0 && (
            <>
              <Divider />
              <List>
                {appliedForPositions.map(({ position, status }) => {
                  const { title: tooltipTitle, color, icon } = status;
                  return (
                    <ListItem disablePadding>
                      <ListItemText
                        primary={
                          <Tooltip title={tooltipTitle}>
                            <Chip color={color} icon={icon} label={position} />
                          </Tooltip>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            </>
          )}
        </CardContent>
      </CardActionArea>

      <CardActions disableSpacing>
        <Button
          size="small"
          variant="outlined"
          onClick={
            applyClick /* CHAOS-51: integrate w/ backend to navigate to specific page */
          }
        >
          Apply
        </Button>
        <ExpandIconButton
          expanded={expanded}
          onClick={handleExpandClick}
          aria-expanded={expanded}
          aria-label="show more"
        >
          <ExpandMoreIcon />
        </ExpandIconButton>
      </CardActions>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent>
          <List>
            {positions.map((position) => (
              <ListItem disablePadding>
                <ListItemText
                  primary={
                    <Chip
                      variant="outlined"
                      label={`${position.number}x ${position.name}`}
                    />
                  }
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default CampaignCard;
