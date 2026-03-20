import { Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function CopyButton({ value, children }: { value: string, children: React.ReactNode }) {
    const [copying, setCopying] = useState(false);

    const handleCopy = () => {
        setCopying(true);
        navigator.clipboard.writeText(value);
        setTimeout(() => {
            setCopying(false);
        }, 500);
    }

    return (
        <Button onClick={handleCopy} variant="outline" className="cursor-pointer relative ">
            <div className={copying ? "invisible flex gap-1 items-center justify-center" : "flex gap-1 items-center justify-center"}>
                {children}
            </div>
            {copying && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <Check className="w-4 h-4" />
                </div>
            )}
        </Button>
    )
}
