import { getDictionary } from "@/app/[lang]/dictionaries";
import { inviteQueryOptions } from "@/models/invite";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import InviteClient from "./invite-client";

type Params = Promise<{ lang: string; inviteId: string }>;

export default async function Page({ params }: { params: Params }) {
  const { lang, inviteId } = await params;

  const dict = await getDictionary(lang);

  const queryClient = new QueryClient();
  const ok = await queryClient
    .prefetchQuery(inviteQueryOptions(inviteId))
    .then(() => true)
    .catch(() => false);

  if (!ok) return notFound();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <InviteClient code={inviteId} dict={dict} />
    </HydrationBoundary>
  );
}



