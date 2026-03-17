import { redirect } from "next/navigation";

export default async function Login({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | undefined }>
}) {
    const to = (await searchParams).to ?? "/dashboard";

    redirect(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/google?to=${encodeURIComponent(to)}`)
}