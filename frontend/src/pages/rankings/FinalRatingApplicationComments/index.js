import React from "react";
import PropTypes from "prop-types";
import { Dialog, DialogTitle, DialogContent, Divider } from "@mui/material";
import ApplicationPreviewer from "../../../components/ApplicationPreviewer";

const dummyApplication = {
  applicationId: "App 1",
  zId: "z5212345",
  mark: 0,
  questions: [
    {
      question: "What scares you about getting older?",
      answer: "Forgetting things.",
    },
    {
      question: "Which book are you ashamed not to have read?",
      answer:
        "Ulysses by James Joyce, because everybody says it’s the greatest book ever written.",
    },
    {
      question: "What is the worst thing anyone’s said to you?",
      answer: "That my father had died. I was nine; he was 40.",
    },
    {
      question: "What did you want to be when you were growing up?",
      answer:
        "I had no idea whatsoever, and nor did anyone else. I thought I’d go to art school and see whether I liked it – and of course I did, and stayed.",
    },
    {
      question: "What is your most treasured possession?",
      answer:
        "A copy of a children’s book my father wrote, The Prince and the Magic Carpet, with “author’s copy” written inside by him.",
    },
    {
      question: "What or who is the greatest love of your life?",
      answer:
        "Deirdre, my wife. She allowed me the indulgence of spending ages developing the vacuum technology and signed those awful things from the bank putting the house and everything you have up to guarantee the loan.",
    },
    {
      question: "What does love feel like?",
      answer: "An overwhelming sensation of caring and passion.",
    },
    {
      question: "When did you last cry, and why?",
      answer:
        "Very recently, when a graduate at the Dyson Institute of Engineering and Technology gave the most brilliant speech on behalf of the students at our first graduation.",
    },
    {
      question: "What do you consider your greatest achievement?",
      answer: "Creating jobs and opportunities for thousands of people.",
    },
    {
      question: "Would you rather have more sex, money or fame?",
      answer: "I can’t complain.",
    },
    {
      question: "How would you like to be remembered?",
      answer:
        "Changing the way young engineers are educated through the Dyson Institute, and fostering creativity and innovation through our foundation.",
    },
    {
      question: "What is the most important lesson life has taught you?",
      answer:
        "Perseverance in the face of failure. It took me five years to crack the vacuum technology, from 1979 to 1984, but it was another nine years before I had a product on the market, mostly because I wasted time trying to licence people who are now my competitors. Finally, in 1992, I decided to make it myself.",
    },
  ],
};

const FinalRatingApplicationComments = (props) => {
  const { name, position, open, handleClose } = props;

  return (
    <Dialog onClose={handleClose} open={open}>
      <DialogTitle>{`${name}'s Application for ${position}`}</DialogTitle>
      <Divider />
      <DialogContent>
        <ApplicationPreviewer application={dummyApplication} />
      </DialogContent>
    </Dialog>
  );
};

FinalRatingApplicationComments.propTypes = {
  name: PropTypes.string.isRequired,
  position: PropTypes.string.isRequired,
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
};

export default FinalRatingApplicationComments;
