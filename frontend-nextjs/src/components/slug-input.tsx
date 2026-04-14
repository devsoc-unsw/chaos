import { Input } from "@/components/ui/input";
import { checkCampaignSlugAvailability } from "@/models/campaign";
import { createProperSlug } from "@/models/slug";
import { useState } from "react";

export default function SlugInput({ orgId, name, value, currentSlug, onChange, onBlur, updateSlugAvailable, dict }: { orgId: string, name: string, value: string, currentSlug?: string, onChange: (value: string) => void, onBlur: () => void, updateSlugAvailable?: (available: boolean) => void, dict: any }) {
    const [slugAvailable, setSlugAvailable] = useState(true);

    const checkSlugAvailability = async () => {
        if (value !== currentSlug) {
            try {
                await checkCampaignSlugAvailability(orgId, value);
                setSlugAvailable(true);
                updateSlugAvailable?.(true);
            } catch {
                setSlugAvailable(false);
                updateSlugAvailable?.(false);
            }
        }
    }

    const handleBlur = () => {
        checkSlugAvailability();
        onBlur();
    }


    return (
        <>
            {name && <p className="text-sm text-gray-500">{dict.dashboard.suggested_slug}: <span className="bg-gray-100 border rounded px-1">{name ? createProperSlug(name) : ""}</span></p>}
            <Input className="max-w-[300px]" type="text" value={value} onChange={(e) => onChange(e.target.value)} onBlur={handleBlur} />
            <p className="text-red-500 text-xs">{!slugAvailable && dict.dashboard.slug_not_available}</p>
        </>
    )
}