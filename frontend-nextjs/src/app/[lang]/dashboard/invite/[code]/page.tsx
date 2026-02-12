import { getDictionary } from "@/app/[lang]/dictionaries";
import { getInvite } from "@/models/invite";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import InviteClient from "./invite-client";
import { getCurrentUser } from "@/lib";
import { User } from "@/models/user";

export default async function Page({ params }: { params: Promise<{ lang: string; code: string }> }) {
  const { lang, code } = await params;
  const dict = await getDictionary(lang);
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: [`invite-${code}`],
    queryFn: () => getInvite(code),
  });


  let user: User | undefined = undefined;
  try {
    user = await getCurrentUser(false);
  } catch (_) {}

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <InviteClient code={code} dict={dict} currentUser={user} />
    </HydrationBoundary>
  );
}



