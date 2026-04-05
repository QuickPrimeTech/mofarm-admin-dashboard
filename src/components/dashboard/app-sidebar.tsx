"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "../logout-button";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";

import {
  BarChart3,
  Package,
  ShoppingCart,
  CreditCard,
  Tag,
  AlertCircle,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart },
  { href: "/dashboard/transactions", label: "Transactions", icon: CreditCard },
  { href: "/dashboard/products", label: "Products", icon: Package },
  { href: "/dashboard/inventory", label: "Inventory", icon: AlertCircle },
  { href: "/dashboard/offers", label: "Special Offers", icon: Tag },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r">
      {/* Header */}
      <SidebarHeader className="px-6 py-4">
        <h1 className="text-xl font-bold">Mofarm Smart Farming Admin</h1>
        <p className="text-sm text-muted-foreground">Dashboard</p>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link href={item.href} className="flex items-center gap-3">
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <LogoutButton />
      </SidebarFooter>
    </Sidebar>
  );
}
