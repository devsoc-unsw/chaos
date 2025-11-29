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
import { getAllOrganisations } from "@/models/organisation"
import { useQuery } from "@tanstack/react-query"
import { redirect, useParams, useRouter } from "next/navigation"
import { APP_VERSION } from "@/lib/const"

interface AdminSidebarProps {
  dict: any;
}

export function AdminSidebar({ dict }: AdminSidebarProps) {
  const router = useRouter();
  const { orgId } = useParams();

  const { data: orgs } = useQuery({
    queryKey: ['organisations'],
    queryFn: getAllOrganisations,
  });

  if (orgs?.length === 0) {
    return redirect("/dashboard/join");
  }

  const selectedOrg = orgs?.find((org) => org.id === orgId) ?? orgs?.[0];

  const handleOrgChange = (newOrgId: string) => {
    router.push(`/dashboard/organisation/${newOrgId}`);
  }

  const items = [
    {
      title: dict.common.campaigns,
      href: "campaigns",
      icon: Megaphone,
    },
    {
      title: dict.dashboard.email_templates,
      href: "templates",
      icon: Mail,
    },
    {
      title: dict.dashboard.members,
      href: "members",
      icon: Users,
    },
    {
      title: dict.common.settings,
      href: "settings",
      icon: Settings,
    },
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
                    <span className="truncate font-semibold">{selectedOrg?.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{dict.common.organisation}</span>
                  </div>
                  <ChevronDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width)" align="start">
                {orgs?.map((org) => (
                  <DropdownMenuItem key={org.id} onSelect={() => handleOrgChange(org.id)}>
                    <Building2 className="mr-2 size-4" />
                    {org.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="/dashboard/organisation/new">
                    <Plus className="mr-2 size-4" />
                    <span>{dict.dashboard.sidebar.create_organisation}</span>
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="overflow-x-hidden">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={`/dashboard/organisation/${orgId}/${item.href}`}>
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
                  <a href={`/dashboard/${orgId}/profile`}>
                    <User />
                    <span>{dict.common.profile}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter >
        <p className="text-xs text-muted-foreground text-center">
          Chaos version {APP_VERSION}
          <br />
          Developed by <a className="hover:underline" href="https://devsoc.app" target="_blank" rel="noopener noreferrer">DevSoc</a>
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}