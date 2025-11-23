import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/admin-sidebar"
import { getDictionary } from "@/app/[lang]/dictionaries";

export default async function Layout({ children, params: { lang } }: { children: React.ReactNode, params: { lang: "en" | "zh-CN" } }) {
  const dict = await getDictionary(lang);

  return (
    <SidebarProvider>
      <AdminSidebar dict={dict} />
      <main>
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  )
}