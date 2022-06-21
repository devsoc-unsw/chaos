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
import { ExpandIconButton } from "./campaignCard.styled";

const positionStatuses = {
  "Peer Mentor": "processing",
  "Senior Mentor": "offered",
};

const status = {
  processing: "Processing application",
  offered: "Position offered",
  rejected: "Application rejected",
};

const colors = {
  processing: "warning",
  offered: "success",
  rejected: "error",
};

const icons = {
  processing: <MoreHorizIcon />,
  offered: <CheckIcon />,
  rejected: <CloseIcon />,
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

  const positionsMap = Object.fromEntries(
    positions.map(({ id, ...position }) => [id, position])
  );
  const appliedForPositions = appliedFor.map(
    (position) => positionsMap[position].name
  );

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
                {appliedForPositions.map((position) => (
                  <ListItem disablePadding>
                    <ListItemText
                      primary={
                        // TODO CHAOS-21: use backend to determine status of user application
                        <Tooltip title={status[positionStatuses[position]]}>
                          <Chip
                            color={colors[positionStatuses[position]]}
                            icon={icons[positionStatuses[position]]}
                            label={position}
                          />
                        </Tooltip>
                      }
                    />
                  </ListItem>
                ))}
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
  appliedFor: PropTypes.arrayOf(PropTypes.string).isRequired,
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
