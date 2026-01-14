'use client';

import { getCurrentUser } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";

export default function Dashboard() {
    const { data } = useQuery({
        queryKey: ['user'],
        queryFn: getCurrentUser,
    });

    return (
        <div>
            <h1>Logged in as: {data?.name}</h1>
        </div>
    );
}