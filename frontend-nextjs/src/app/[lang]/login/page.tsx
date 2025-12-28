import { redirect } from "next/navigation";

const OAUTH_CALLBACK_URL = process.env.NEXT_OAUTH_CALLBACK_URL || "http://localhost:3000";

export default async function Login({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | undefined }>
}) {
    const to = (await searchParams).to ?? "/dashboard";

    redirect(`${process.env.NEXT_API_BASE_URL}/auth/google?to=${encodeURIComponent(to)}`)
}