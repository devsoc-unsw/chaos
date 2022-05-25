import React, { useContext, useEffect, useState } from "react";
import { Box, Container, Button, Grid, Tab } from "@mui/material";
import { TabContext, TabList, TabPanel } from "@mui/lab";

import { Link, useParams } from "react-router-dom";
import ReviewerStepper from "../../components/ReviewerStepper";
import ApplicationsList from "./ApplicationsList";
import { SetNavBarTitleContext } from "../../App";
import {
  getApplicationAnswers,
  getApplicationRatings,
  getRoleApplications,
  getRoleQuestions,
  getCampaignRoles,
  setApplicationRating,
} from "../../api";

// TODO: CHAOS-12 retrieve data from BE instead of using dummy data
const dummyApplications = {
  "Student Experience Director": [
    {
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
    },
    {
      applicationId: "App 2",
      zId: "z1234567",
      mark: 0,
      questions: [
        {
          question: "What is the trait you most deplore in yourself?",
          answer: "I’m impatient.",
        },
        {
          question: "What is the trait you most deplore in others?",
          answer: "People who are slow.",
        },
        {
          question: "What was your most embarrassing moment?",
          answer:
            "My third time playing at Glastonbury, I crowd surfed, but the stage was too high to climb back on to. I started shouting at a guy on the stage to help me up – but then realised he was the BBC cameraman and I was shouting, “Help me!” to the nation.",
        },
        {
          question: "Describe yourself in three words",
          answer: "James Cucking Funt (sic).",
        },
        {
          question: "What do you most dislike about your appearance?",
          answer:
            "My hair, face, nose, neck, stomach, legs and feet. But I have great guns.",
        },
        {
          question: "Who would play you in the film of your life?",
          answer: "",
        },
        {
          question: "Who is your celebrity crush?",
          answer:
            "Alison Hammond. I did Bake Off with her and she is just awesome.",
        },
        {
          question: "What is your guiltiest pleasure?",
          answer: "I occasionally listen to James Blunt.",
        },
        {
          question: "What is your most unappealing habit?",
          answer:
            "Walking up to strangers on the London underground and telling them they’re beautiful.",
        },
      ],
    },
  ],
  "asldfk asdlfkj asdf": [
    {
      applicationId: "App 1",
      zId: "lasdkfjlsadjf",
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
    },
    {
      applicationId: "App 2",
      zId: "z1234567",
      mark: 0,
      questions: [
        {
          question: "What is the trait you most deplore in yourself?",
          answer: "I’m impatient.",
        },
        {
          question: "What is the trait you most deplore in others?",
          answer: "People who are slow.",
        },
        {
          question: "What was your most embarrassing moment?",
          answer:
            "My third time playing at Glastonbury, I crowd surfed, but the stage was too high to climb back on to. I started shouting at a guy on the stage to help me up – but then realised he was the BBC cameraman and I was shouting, “Help me!” to the nation.",
        },
        {
          question: "Describe yourself in three words",
          answer: "James Cucking Funt (sic).",
        },
        {
          question: "What do you most dislike about your appearance?",
          answer:
            "My hair, face, nose, neck, stomach, legs and feet. But I have great guns.",
        },
        {
          question: "Who would play you in the film of your life?",
          answer: "",
        },
        {
          question: "Who is your celebrity crush?",
          answer:
            "Alison Hammond. I did Bake Off with her and she is just awesome.",
        },
        {
          question: "What is your guiltiest pleasure?",
          answer: "I occasionally listen to James Blunt.",
        },
        {
          question: "What is your most unappealing habit?",
          answer:
            "Walking up to strangers on the London underground and telling them they’re beautiful.",
        },
      ],
    },
  ],
};

const dummyPositions = Object.keys(dummyApplications);

const Marking = () => {
  const setNavBarTitle = useContext(SetNavBarTitleContext);
  const { campaignId } = useParams();
  // TODO: CHAOS-12 handle candidates from multiple positions from BE
  const [applications, setApplications] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState("");
  const [selectedApplication, setSelectedApplication] = useState(0);

  useEffect(() => {
    (async () => {
      setNavBarTitle("2022 Subcommittee Recruitment (Hardcoded Title)");
      const rolesResp = await getCampaignRoles(campaignId);
      const { roles } = await rolesResp.json();

      const allApplications = await Promise.all(
        roles.map(async (role) => {
          const resp = await getRoleApplications(role.id);
          const roleApplications = await resp.json();
          return roleApplications.applications;
        })
      );
      const questions = await Promise.all(
        roles.map(async (role) => {
          const resp = await getRoleQuestions(role.id);
          const roleQuestions = await resp.json();
          return roleQuestions.questions;
        })
      );
      const answers = await Promise.all(
        allApplications.map((a) =>
          Promise.all(
            a.map(async (application) => {
              const resp = await getApplicationAnswers(application.id);
              const applicationAnswers = await resp.json();
              return applicationAnswers.answers;
            })
          )
        )
      );

      setSelectedPosition(roles[0].name);
      setApplications(
        Object.fromEntries(
          roles.map((role, roleIdx) => [
            role.name,
            allApplications[roleIdx].map((application, applicationIdx) => ({
              applicationId: application.id,
              zId: "dummy",
              mark: 0,
              questions: questions[roleIdx].map((question, questionIdx) => ({
                question: question.title,
                answer:
                  answers[roleIdx][applicationIdx][questionIdx]?.description,
              })),
            })),
          ])
        )
      );
    })();
  }, []);

  const setMark = async (newMark) => {
    const newApplications = { ...applications };
    newApplications[selectedPosition][selectedApplication].mark = newMark;
    setApplications(newApplications);
    await setApplicationRating(selectedApplication, newMark);
  };

  return (
    <Container>
      <ReviewerStepper activeStep={0} />

      <TabContext value={selectedPosition}>
        <Box
          sx={{
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            marginBottom: 2,
          }}
        >
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <TabList onChange={(_, t) => setSelectedPosition(t)}>
              {Object.keys(applications).map((role) => (
                <Tab label={role} value={role} key={role} />
              ))}
            </TabList>
          </Box>
        </Box>
      </TabContext>

      {Object.keys(applications).length ? (
        <ApplicationsList
          applications={applications[selectedPosition] || []}
          setMark={setMark}
          selectedApplication={selectedApplication}
          setSelectedApplication={setSelectedApplication}
        />
      ) : null}

      <Grid container justifyContent="flex-end">
        <Button
          component={Link}
          to={`/rankings/${campaignId}`}
          disabled={Object.values(applications).some((a) =>
            a.some((application) => application.mark === 0)
          )}
        >
          Next (Rankings)
        </Button>
      </Grid>
    </Container>
  );
};

export default Marking;
