import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  CardActionArea,
  Collapse,
  CardActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Tooltip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { tuple } from "utils";
import { ExpandIconButton } from "./campaignCard.styled";

const statuses = {
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

const CampaignCard = ({
  title,
  appliedFor,
  positions,
  startDate,
  endDate,
  img,
  applyClick,
}) => {
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

CampaignCard.propTypes = {
  title: PropTypes.string.isRequired,
  appliedFor: PropTypes.arrayOf(tuple(PropTypes.number, PropTypes.number))
    .isRequired,
  positions: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      number: PropTypes.number,
    })
  ).isRequired,
  startDate: PropTypes.string.isRequired,
  endDate: PropTypes.string.isRequired,
  img: PropTypes.string.isRequired,
  applyClick: PropTypes.func.isRequired,
};

export default CampaignCard;
