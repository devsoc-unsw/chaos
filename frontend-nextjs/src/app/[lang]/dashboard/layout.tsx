import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/admin-sidebar"
import { getDictionary } from "@/app/[lang]/dictionaries";

export default async function Layout({ children, params }: { children: React.ReactNode, params: { lang: string } }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return (
    <SidebarProvider>
      <AdminSidebar dict={dict} />
      <main className="w-full">
        <SidebarTrigger />
        <div className="mx-2">
          {children}
        </div>
      </main>
    </SidebarProvider>
  )
}