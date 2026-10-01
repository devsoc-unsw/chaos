import { redirect } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";

export default async function Login({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | undefined }>
}) {
    const to = (await searchParams).to ?? "/dashboard";

    // add a trailing slash if not present
    const apiBase = API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;

    redirect(`${apiBase}auth/google?to=${encodeURIComponent(to)}`);

}