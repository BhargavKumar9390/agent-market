import React, { useState, useEffect } from "react";
import clsx from "clsx";
import { Popover } from "@heroui/react";
import { useSidebarContext } from "../layout-context";
import { usePathname } from "next/navigation";

interface Props {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 9L12 15L18 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export const SidebarCollapse = ({
  icon,
  title,
  children,
  defaultOpen = false,
}: Props) => {
  const { sidebarOpen, isMdUp } = useSidebarContext();
  const pathname = usePathname();
  const compact = isMdUp && !sidebarOpen;
  
  // Check if any child is active to auto-expand
  const hasActiveChild = React.Children.toArray(children).some((child) => {
    if (React.isValidElement(child)) {
      return (child.props as any).isActive === true;
    }
    return false;
  });

  const [isOpen, setIsOpen] = useState(defaultOpen || hasActiveChild);
  const [railFlyoutOpen, setRailFlyoutOpen] = useState(false);

  useEffect(() => {
    if (hasActiveChild) setIsOpen(true);
  }, [hasActiveChild]);

  if (compact) {
    return (
      <div className="flex w-full justify-center px-0.5 py-1">
        <Popover isOpen={railFlyoutOpen} onOpenChange={setRailFlyoutOpen}>
          <Popover.Trigger
            aria-label={`${title} menu`}
            className={clsx(
              "flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-default-600 outline-none transition-colors hover:bg-[var(--sidebar-item-hover)]",
              hasActiveChild &&
                "bg-[var(--sidebar-item-active)] text-[var(--sidebar-fg-active)] [&_.text-default-500]:text-[var(--sidebar-fg-active)]",
            )}
          >
            <span className="flex items-center justify-center text-inherit [&_svg]:size-4">
              {icon}
            </span>
          </Popover.Trigger>
          <Popover.Content
            placement="right top"
            offset={10}
            className="rounded-2xl border border-divider bg-[var(--overlay)] p-1.5 shadow-[var(--overlay-shadow)] outline-none"
          >
            <Popover.Dialog className="max-h-[min(70dvh,24rem)] min-w-[13.5rem] overflow-y-auto outline-none">
              <Popover.Heading className="px-2 pb-1 pt-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {title}
              </Popover.Heading>
              <div className="flex flex-col gap-1">
                {React.Children.map(children, (child) =>
                  React.isValidElement(child)
                    ? React.cloneElement(child as React.ReactElement<any>, {
                        forceShowLabel: true,
                        onActivate: () => setRailFlyoutOpen(false),
                      })
                    : child,
                )}
              </div>
            </Popover.Dialog>
          </Popover.Content>
        </Popover>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "flex w-full cursor-pointer items-center gap-3 rounded-xl px-2.5 py-1 transition-all duration-150 outline-none select-none",
          isOpen ? "text-default-900" : "text-default-600 hover:bg-[var(--sidebar-item-hover)]"
        )}
      >
        <span className="flex shrink-0 items-center justify-center [&_svg]:size-4 text-default-500">
          {icon}
        </span>
        <span className="flex-1 text-left font-medium text-sm">
          {title}
        </span>
        <ChevronDownIcon 
          className={clsx(
            "transition-transform duration-200 text-default-400 size-4",
            isOpen ? "rotate-0" : "rotate-[-90deg]"
          )}
        />
      </button>

      <div
        className={clsx(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-in-out",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="relative ml-4 mt-0 flex flex-col gap-1 pl-3">
            <div className="absolute left-0 top-0 bottom-3 w-px bg-default-100" />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
