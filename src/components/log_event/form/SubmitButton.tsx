import React from "react";
import { Button } from "@/components/ui";
import { FaPlus, FaSpinner } from "@/utils/iconImport";

// Submit Button Component
export const SubmitButton: React.FC<{
  isPending: boolean;
}> = ({ isPending }) => (
  <Button
    type="submit"
    disabled={isPending}
    aria-label={isPending ? "Submitting event" : "Log new event"}
    aria-busy={isPending}
    className="event-button w-full bg-nightly-aquamarine hover:bg-nightly-aquamarine/80 disabled:opacity-50 text-black px-4 sm:px-6 py-3 sm:py-4 rounded font-medium transition-colors flex items-center justify-center gap-2 min-h-[44px] text-sm sm:text-base"
  >
    {isPending ? (
      <>
        <FaSpinner
          className="animate-spin text-base sm:text-lg"
          aria-hidden="true"
        />
        <span className="hidden sm:inline">Logging Event...</span>
        <span className="sm:hidden">Logging...</span>
      </>
    ) : (
      <>
        <FaPlus
          className="transition-transform group-hover:scale-110 text-base sm:text-lg"
          aria-hidden="true"
        />
        Log Event
      </>
    )}
  </Button>
);
