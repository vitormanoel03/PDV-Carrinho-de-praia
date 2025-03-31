import { useState } from "react";
import { Menu, Bell, ChevronDown, User, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [notificationCount] = useState(3);

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return "U";
    if (user.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
    }
    return user.username.substring(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-white shadow-md">
      <div className="flex justify-between items-center px-4 py-2">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onToggleSidebar}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-medium text-primary ml-2">Sistema PDV</h1>
        </div>

        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {notificationCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-3 border-b">
                <h3 className="text-sm font-medium">Notificações</h3>
              </div>
              <div className="max-h-72 overflow-y-auto">
                <div className="px-4 py-3 border-b hover:bg-muted cursor-pointer">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      <span className="material-icons">shopping_cart</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Nova venda realizada</p>
                      <p className="text-xs text-muted-foreground">10 minutos atrás</p>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 border-b hover:bg-muted cursor-pointer">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      <span className="material-icons">inventory</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Estoque baixo de produtos</p>
                      <p className="text-xs text-muted-foreground">30 minutos atrás</p>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 border-b hover:bg-muted cursor-pointer">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      <span className="material-icons">person_add</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Novo cliente cadastrado</p>
                      <p className="text-xs text-muted-foreground">1 hora atrás</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-3 text-center border-t">
                <Button variant="link" size="sm">Ver todas</Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:block text-sm font-medium">
                  {user?.name || user?.username}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
