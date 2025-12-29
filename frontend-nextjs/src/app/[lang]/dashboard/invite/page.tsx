import { getDictionary } from "@/app/[lang]/dictionaries";
import { getInvite } from "@/models/invite";
import { notFound } from "next/navigation";
import InviteClient from "./invite-client";

type Params = Promise<{ lang: string; code: string }>;

export default async function InvitePage({ params }: { params: Params }) {
  const { lang, code } = await params;
  const dict = await getDictionary(lang);

  let invite;
  try {
    invite = await getInvite(code);
  } catch {
    return notFound();
  }

  return <InviteClient code={code} invite={invite} dict={dict} />;
}


