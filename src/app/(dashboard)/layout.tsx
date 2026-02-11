import { Suspense } from "react";
import { Sidebar } from "@/components/sidebar";
import { ToastHandler } from "@/components/toast-handler";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50 font-[family-name:var(--font-geist-sans)]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
      <Suspense>
        <ToastHandler />
      </Suspense>
    </div>
  );
}
