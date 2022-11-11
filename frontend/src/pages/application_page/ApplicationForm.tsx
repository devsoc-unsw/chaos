import "twin.macro";

import { ChevronRightIcon } from "@heroicons/react/20/solid";

import Button from "components/Button";
import Card from "components/Card";
import Textarea from "components/Textarea";

import type { RoleQuestions } from "./types";
import type { Role } from "types/api";

type Props = {
  roles: Role[];
  rolesSelected: number[];
  roleQuestions: RoleQuestions;
  answers: { [question: number]: string };
  setAnswer: (_question: number, _answer: string) => void;
  onSubmit: () => void;
};
const ApplicationForm = ({
  roles,
  rolesSelected,
  roleQuestions,
  answers,
  setAnswer,
  onSubmit,
}: Props) => (
  <Card tw="flex-1">
    <h2 tw="text-2xl">Questions</h2>
    {rolesSelected.map((role) => (
      <section key={role} tw="my-2">
        <h3 tw="text-xl">{roles.find((r) => r.id === role)?.name}</h3>
        {roleQuestions[role].map(({ id, text }) => (
          <label key={id} tw="block mt-2">
            <span>{text}</span>
            <Textarea
              tw="w-full max-w-xl"
              value={answers[id]}
              onChange={(e) => setAnswer(id, e.target.value)}
            />
          </label>
        ))}
      </section>
    ))}
    <div tw="flex justify-end">
      <Button
        tw="flex items-center"
        onClick={onSubmit}
        disabled={rolesSelected.length === 0}
      >
        Submit <ChevronRightIcon tw="w-6 h-6 -mr-2" />
      </Button>
    </div>
  </Card>
);

export default ApplicationForm;
