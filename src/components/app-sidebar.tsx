"use client";

import * as React from "react";
import {
  AudioWaveform,
  BarChartIcon,
  BrainCog,
  Command,
  FolderIcon,
  GalleryVerticalEnd,
  HelpCircleIcon,
  LayoutDashboard,
  LayoutDashboardIcon,
  ListIcon,
  ListOrdered,
  PiggyBank,
  SearchIcon,
  SettingsIcon,
  Shapes,
  UsersIcon,
  Wallet,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavSecondary } from "./nav-secondary";

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Transactions",
      url: "/transactions",
      icon: ListOrdered,
    },
    {
      title: "Budgets",
      url: "/budgets",
      icon: Wallet,
    },
    {
      title: "Savings",
      url: "/savings",
      icon: PiggyBank,
    },
    {
      title: "Categories",
      url: "/categories",
      icon: Shapes,
    },
    {
      title: "AI Agent",
      url: "/agent",
      icon: BrainCog,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: SettingsIcon,
    },
    {
      title: "Get Help",
      url: "/get-help",
      icon: HelpCircleIcon,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
