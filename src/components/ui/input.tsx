import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    React.useEffect(() => {
      const input = inputRef.current;
      if (!input || type !== "number") return;

      const handleWheel = (e: WheelEvent) => {
        // Only prevent default and change value if we actually meant to scroll the input
        // This avoids double-step bugs and prevents the dialog/page from scrolling.
        e.preventDefault();

        // Increment or decrement based on scroll direction
        if (e.deltaY < 0) {
          input.stepUp();
        } else {
          input.stepDown();
        }

        // Force React to recognize the change
        const eventArgs = { bubbles: true, cancelable: true };
        input.dispatchEvent(new Event("input", eventArgs));
        input.dispatchEvent(new Event("change", eventArgs));
      };

      // passive: false is required to allow e.preventDefault()
      input.addEventListener("wheel", handleWheel, { passive: false });

      return () => {
        input.removeEventListener("wheel", handleWheel);
      };
    }, [type]);

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={(node) => {
          inputRef.current = node;
          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
