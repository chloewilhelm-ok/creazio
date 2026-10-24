import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-lg border border-deep-forest/15 bg-coquille px-4 py-3 text-base transition-colors placeholder:text-muted-foreground focus-visible:border-deep-forest focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(224,116,94,0.25)] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
