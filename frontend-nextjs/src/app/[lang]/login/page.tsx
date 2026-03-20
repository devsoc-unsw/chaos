import { redirect } from "next/navigation";

export default async function Login({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | undefined }>
}) {
    const to = (await searchParams).to ?? "/dashboard";

    const raw = process.env.NEXT_PUBLIC_API_BASE_URL;
    const apiBase =
      raw && String(raw).startsWith("http") ? raw : "http://localhost:8080";
    redirect(`${apiBase}/auth/google?to=${encodeURIComponent(to)}`);
}