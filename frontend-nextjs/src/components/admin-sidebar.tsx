"use client"

import { Building2, ChevronDown, Mail, Megaphone, Plus, Settings, User, Users } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useState } from "react"

interface AdminSidebarProps {
  dict: any;
}

export function AdminSidebar({ dict }: AdminSidebarProps) {
  const [selectedOrg, setSelectedOrg] = useState<string>("DevSoc")

  const items = [
    {
      title: dict.dashboard.sidebar.campaigns,
      href: "campaigns",
      icon: Megaphone,
    },
    {
      title: dict.dashboard.sidebar.email_templates,
      href: "templates",
      icon: Mail,
    },
    {
      title: dict.dashboard.sidebar.members,
      href: "members",
      icon: Users,
    },
    {
      title: dict.dashboard.sidebar.settings,
      href: "settings",
      icon: Settings,
    },
  ]


  const orgs = [
    {
      id: "1",
      name: "DevSoc",
    },
    {
      id: "2",
      name: "CSESoc",
    }
  ]

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="w-full">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Building2 className="size-4" />
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{selectedOrg}</span>
                    <span className="truncate text-xs text-muted-foreground">Organization</span>
                  </div>
                  <ChevronDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width)" align="start">
                {orgs.map((org) => (
                  <DropdownMenuItem key={org.id} onSelect={() => setSelectedOrg(org.name)}>
                    <Building2 className="mr-2 size-4" />
                    {org.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="/organisation/new">
                    <Plus className="mr-2 size-4" />
                    <span>{dict.dashboard.sidebar.create_organisation}</span>
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={`/dashboard/${item.href}`}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/dashboard/profile">
                    <User />
                    <span>{dict.dashboard.sidebar.profile}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}