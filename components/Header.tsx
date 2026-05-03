"use client";

import { HomeIcon, Package, Users, ShoppingCart, LogOut, Droplets } from "lucide-react";
import Link from "next/link";
import { NavButton } from "@/components/NavButton";
import { ModeToggle } from "@/components/ModeToggle";
import { Button } from "@/components/ui/button";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";


export function Header() {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b sticky top-0 z-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/home" className="flex items-center gap-2">
              <Droplets className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Barbs Bottles
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Custom Bottles
                </p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <NavButton href="/home" label="Dashboard" icon={HomeIcon} />
              <NavButton href="/customers" label="Customers" icon={Users} />
              <NavButton href="/products" label="Products" icon={Package} />
              <NavButton href="/orders" label="Orders" icon={ShoppingCart} />
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <ModeToggle />
            <LogoutLink>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Sign out"
                className="dark:text-white"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </LogoutLink>
          </div>
        </div>
      </div></header>
  );
}
