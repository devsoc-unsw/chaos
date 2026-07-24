import { createElement } from "react";
import { render } from "@react-email/render";
import { AcceptanceEmail} from "./acceptance";
import type { EmailTemplateVars, RenderedEmail } from "./types";

function substituteVars(
  text: string,
  vars: Record<string, string | undefined>,
): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
    return vars[key] ?? "";
  });
}

export async function renderAcceptanceEmail(
  vars: EmailTemplateVars,
): Promise<RenderedEmail> {
  const html = await render(createElement(AcceptanceEmail, vars));
  const subject = substituteVars("Thanks for testing out CHAOS!", { ...vars });

  return { subject, html };
}
