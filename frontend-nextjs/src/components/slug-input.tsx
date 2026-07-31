import { Input } from "@/components/ui/input";
import { checkCampaignSlugAvailability } from "@/models/campaign";
import { createProperSlug } from "@/models/slug";
import { useEffect, useState } from "react";

export default function SlugInput({
  orgId,
  name,
  value,
  currentSlug,
  onChange,
  onBlur,
  updateSlugAvailable,
  dict,
}: {
  orgId: string;
  name: string;
  value: string;
  placeholder?: string;
  currentSlug?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  updateSlugAvailable?: (available: boolean) => void;
  dict: any;
}) {
  const [slugAvailable, setSlugAvailable] = useState(true);
  const [valueOverride, setValueOverride] = useState(false);

  const effectiveSlug = valueOverride ? value : (currentSlug ?? value);

  // Keep parent slug state in sync with the autofilled suggestion
  // until the user manually edits the field.
  useEffect(() => {
    if (valueOverride) return;
    if (!currentSlug) return;
    if (value === currentSlug) return;
    onChange(currentSlug);
  }, [currentSlug, value, valueOverride, onChange]);

  const checkSlugAvailability = async (slugToCheck: string) => {
    if (!slugToCheck) return;

    try {
      await checkCampaignSlugAvailability(orgId, slugToCheck);
      setSlugAvailable(true);
      updateSlugAvailable?.(true);
    } catch (_) {
      setSlugAvailable(false);
      updateSlugAvailable?.(false);
    }
  };

  const handleBlur = () => {
    checkSlugAvailability(effectiveSlug);
    onBlur();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setValueOverride(true);
  };

  return (
    <>
      {name && (
        <p className="text-sm text-gray-500">
          {dict.dashboard.suggested_slug}:{" "}
          <span className="bg-gray-100 border rounded px-1">
            {name ? createProperSlug(name) : ""}
          </span>
        </p>
      )}
      <Input
        className="max-w-[300px]"
        type="text"
        value={effectiveSlug}
        onChange={(e) => handleChange(e)}
        onBlur={handleBlur}
      />
      <p className="text-red-500 text-xs">
        {!slugAvailable && dict.dashboard.slug_not_available}
      </p>
    </>
  );
}
