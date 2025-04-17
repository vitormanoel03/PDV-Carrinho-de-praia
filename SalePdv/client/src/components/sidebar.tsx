import { useLocation, Link } from "wouter";
import { Store, BarChart2, ShoppingBag, Users, FileText, Settings, LifeBuoy, Layout, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isVisible: boolean;
}

export default function Sidebar({ isVisible }: SidebarProps) {
  const [location] = useLocation();

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: <Layout className="h-5 w-5" /> },
    { name: "PDV", path: "/pos", icon: <ShoppingBag className="h-5 w-5" /> },
    { name: "Produtos", path: "/products", icon: <Store className="h-5 w-5" /> },
    { name: "Vendas", path: "/sales", icon: <FileText className="h-5 w-5" /> },
    { name: "Clientes", path: "/customers", icon: <Users className="h-5 w-5" /> },
    { name: "Relatórios", path: "/reports", icon: <BarChart2 className="h-5 w-5" /> },
    { name: "Configurações", path: "/settings", icon: <Settings className="h-5 w-5" /> },
    { name: "Mesas", path: "/table-management", icon: <Table2 className="h-5 w-5" /> }, // Added Table Management item
  ];

  if (!isVisible) {
    return null;
  }

  return (
    <aside className="w-64 bg-[#424242] text-white flex-shrink-0 hidden lg:block">
      <div className="h-full flex flex-col">
        <div className="p-4">
          <div className="bg-[#212121] rounded-md p-2">
            <div className="flex items-center space-x-2">
              <Store className="h-5 w-5" />
              <div>
                <p className="text-sm font-medium">Loja Principal</p>
                <p className="text-xs opacity-80">Centro, São Paulo</p>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto">
          <ul className="px-2 space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link href={item.path}>
                  <a
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-md text-gray-300 hover:bg-[#616161] hover:text-white",
                      location === item.path && "bg-primary text-white"
                    )}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-[#616161]">
          <div className="flex items-center space-x-3">
            <LifeBuoy className="h-5 w-5" />
            <div>
              <p className="text-sm font-medium">Suporte</p>
              <p className="text-xs opacity-80">(11) 9999-9999</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}