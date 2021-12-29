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
  IconButton,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { ExpandIconButton } from "./campaignCard.styled";

// const ExpandMore = styled((props) => {
//   const { expand, ...other } = props;
//   return <IconButton {...other} />;
// })(({ theme, expand }) => ({
//   transform: !expand ? "rotate(0deg)" : "rotate(180deg)",
//   marginLeft: "auto",
//   transition: theme.transitions.create("transform", {
//     duration: theme.transitions.duration.shortest,
//   }),
// }));

const CampaignCard = (props) => {
  const [expanded, setExpanded] = useState(false);
  const { title, appliedFor, positions, startDate, endDate, img } = props;

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

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
          <Typography variant="h6">{title}</Typography>
        </CardContent>
      </CardActionArea>

      <CardActions>
        <Button size="small" variant="outlined">
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
          {positions.map((position) => (
            <Typography>{`${position.number}x ${position.name}`}</Typography>
          ))}
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
};

export default CampaignCard;
