import { getDictionary } from "@/app/[lang]/dictionaries";
import { inviteQueryOptions } from "@/models/invite";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import InviteClient from "./invite-client";

type Params = Promise<{ lang: string; inviteId: string }>;

export default async function Page({ params }: { params: Params }) {
  const { lang, inviteId } = await params;

  const dict = await getDictionary(lang);

  try {
    const queryClient = new QueryClient();
    await queryClient.prefetchQuery(inviteQueryOptions(inviteId));

    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
        <InviteClient code={inviteId} dict={dict} />
      </HydrationBoundary>
    );
  } catch {
    return notFound();
  }
}


