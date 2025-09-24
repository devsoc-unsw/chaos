import "twin.macro";

import { ChevronRightIcon } from "@heroicons/react/20/solid";

import Button from "components/Button";
import Card from "components/Card";
import Textarea from "components/Textarea";

import type { RoleQuestions } from "./types";
import type { Role } from "types/api";

type Props = {
  roles: Role[];
  rolesSelected: string[];
  roleQuestions: RoleQuestions;
  answers: { [question: string]: string };
  setAnswer: (_question: string, _answer: string) => void;
  onSubmit: () => void;
  loadingRoleQuestions: Set<string>;
};
const ApplicationForm = ({
  roles,
  rolesSelected,
  roleQuestions,
  answers,
  setAnswer,
  onSubmit,
  loadingRoleQuestions,
}: Props) => (
  <Card tw="flex-1">
    <h2 tw="text-2xl">Questions</h2>
    {rolesSelected.map((role) => (
      <section key={role} tw="my-2">
        <h3 tw="text-xl">{roles.find((r) => r.id === role)?.name}</h3>
        {loadingRoleQuestions.has(role) ? (
          <div tw="mt-2 p-4 text-gray-600">
            Loading questions for this role...
          </div>
        ) : roleQuestions[role] ? (
          roleQuestions[role].map(({ id, text }) => (
            <label key={id} tw="mt-2 block">
              <span>{text}</span>
              <Textarea
                tw="mt-1 w-full max-w-xl"
                value={answers[id]}
                onChange={(e) => setAnswer(id, e.target.value)}
              />
            </label>
          ))
        ) : (
          <div tw="mt-2 p-4 text-gray-600">
            No questions available for this role.
          </div>
        )}
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
