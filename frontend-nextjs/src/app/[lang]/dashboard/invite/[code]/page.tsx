import { getDictionary } from "@/app/[lang]/dictionaries";
import { getInvite } from "@/models/invite";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import InviteClient from "./invite-client";

export default async function Page({ params }: { params: Promise<{ lang: string; code: string }> }) {
  const { lang, code } = await params;
  const dict = await getDictionary(lang);
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: [`invite-${code}`],
    queryFn: () => getInvite(code),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <InviteClient code={code} dict={dict} />
    </HydrationBoundary>
  );
}



