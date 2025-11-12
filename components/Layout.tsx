
import React from 'react';
import { Page } from '../App';
import { cn } from '../lib/utils';
import { DashboardIcon, WalletIcon, UsersIcon, BellIcon, UserCircleIcon } from './Icons';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
  { id: 'charges', label: 'Cobranças', icon: WalletIcon },
  { id: 'clients', label: 'Clientes', icon: UsersIcon },
  { id: 'notifications', label: 'Notificações', icon: BellIcon },
  { id: 'profile', label: 'Perfil', icon: UserCircleIcon },
];

const Layout: React.FC<LayoutProps> = ({ children, currentPage, setCurrentPage }) => {
  return (
    <div className="flex min-h-screen w-full">
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 md:flex">
        <div className="mb-8 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-emerald-500"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
            <h1 className="text-2xl font-bold">PingPague</h1>
        </div>
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id as Page)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-slate-500 transition-all hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50',
                currentPage === item.id && 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto">
            <div className="text-xs text-slate-500">
                &copy; 2024 PingPague. Todos os direitos reservados.
            </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
            <div className="font-semibold text-lg capitalize">{currentPage}</div>
            <div className="flex items-center gap-4">
                <span className="text-sm">Olá, Usuário</span>
                <UserCircleIcon className="h-8 w-8 text-slate-500" />
            </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
