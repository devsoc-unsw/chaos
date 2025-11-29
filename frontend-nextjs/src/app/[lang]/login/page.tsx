import { redirect } from "next/navigation";

const OAUTH_CALLBACK_URL = process.env.NEXT_OAUTH_CALLBACK_URL || "http://localhost:3000";

export default function Login() {
    redirect(OAUTH_CALLBACK_URL);
}