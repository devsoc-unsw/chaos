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
          <label key={id} tw="mt-2 block">
            <span>{text}</span>
            <Textarea
              tw="mt-1 w-full max-w-xl"
              value={answers[id]}
              onChange={(e) => setAnswer(id, e.target.value)}
            />
          </label>
        ))}
      </section>
    ))}
    <div tw="flex justify-end">
      <Button
        tw="gap-0"
        onClick={onSubmit}
        disabled={rolesSelected.length === 0}
      >
        Submit <ChevronRightIcon tw="-mr-2 h-6 w-6" />
      </Button>
    </div>
  </Card>
);

export default ApplicationForm;
