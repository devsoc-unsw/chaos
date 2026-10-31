import { redirect } from "next/navigation";
import { PUBLIC_API_BASE_URL } from "@/lib/api";

export default async function Login({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | undefined }>
}) {
    const to = (await searchParams).to ?? "/dashboard";

    // add a trailing slash if not present
    const apiBase = PUBLIC_API_BASE_URL.endsWith("/")
        ? PUBLIC_API_BASE_URL
        : `${PUBLIC_API_BASE_URL}/`;

    redirect(`${apiBase}auth/google?to=${encodeURIComponent(to)}`);

}
