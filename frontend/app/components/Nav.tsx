"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

export function Nav() {
  const [open, setOpen] = useState("");
  const pathname = usePathname();

  // Close menu when route changes
  useEffect(() => {
    setOpen("");
  }, [pathname]);

  const closeMenu = () => setOpen("");

  const ListItem = ({
    href,
    title,
    children,
    className,
  }: {
    href: string;
    title: string;
    children: React.ReactNode;
    className?: string;
  }) => {
    return (
      <li>
        <NavigationMenuLink asChild>
          <Link
            href={href}
            onClick={closeMenu}
            className={cn(
              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
              className
            )}
          >
            <div className="font-sans text-sm font-medium leading-none">{title}</div>
            <p className="line-clamp-2 font-sans text-xs leading-snug text-muted-foreground">
              {children}
            </p>
          </Link>
        </NavigationMenuLink>
      </li>
    );
  };

  return (
    <>
      {/* Collapsible menu */}
      <div className="fixed left-6 top-6 z-50">
        <NavigationMenu key={pathname} value={open} onValueChange={setOpen}>
          <NavigationMenuList>
            <NavigationMenuItem value="menu">
              <NavigationMenuTrigger
                className="bg-transparent px-4 py-2 font-sans text-sm text-muted-foreground/60 hover:bg-transparent hover:text-foreground data-[state=open]:bg-accent/50"
                onPointerEnter={(e) => e.preventDefault()}
                onPointerMove={(e) => e.preventDefault()}
              >
                Menu
              </NavigationMenuTrigger>
              <NavigationMenuContent
                onPointerLeave={(e) => e.preventDefault()}
              >
                <ul className="grid w-[250px] gap-1 p-2">
                  <ListItem href="/" title="Ask">
                    Ask a question, receive guidance
                  </ListItem>
                  <ListItem href="/read" title="Read">
                    Browse all chapters and verses
                  </ListItem>
                  <SignedIn>
                    <ListItem href="/daily" title="Daily">
                      Your daily verse
                    </ListItem>
                    <ListItem href="/saved" title="Saved">
                      Your saved verses
                    </ListItem>
                    <ListItem href="/history" title="History">
                      Your past queries
                    </ListItem>
                    <ListItem href="/settings" title="Settings">
                      Email preferences
                    </ListItem>
                  </SignedIn>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* Auth header */}
      <header className="fixed right-6 top-6 z-50 flex items-center gap-4">
        <SignedOut>
          <SignInButton mode="modal">
            <button className="font-sans text-sm text-muted-foreground/60 transition-colors hover:text-foreground">
              Sign in
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
              },
            }}
          />
        </SignedIn>
      </header>
    </>
  );
}
