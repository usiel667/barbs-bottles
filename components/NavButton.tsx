"use client";


import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  icon: LucideIcon;
  href: string;
  label: string;

};

export function NavButton({ icon: Icon, href, label }: Props) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href) && href !== "/";

  return (
    <Button
      asChild
      variant={isActive ? "default" : "ghost"}
      size="sm"
      className={cn("gap-2 text-black dark:text-white dark:hover:text-gray-900", isActive && "bg-blue-600 hover:bg-blue-700 text-white")}
    >
      <Link href={href}>
        <Icon className="h-4 w-4" />
        <span className="hidden sm:block">{label}</span>
      </Link>
    </Button>
  );
}
