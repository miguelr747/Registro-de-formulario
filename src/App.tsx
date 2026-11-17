import { useCallback, useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  HelpCircle,
  FileCheck2,
  Activity,
  FileBarChart,
  Users,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { apiFetch, getStoredToken, setStoredToken } from './utils/api';
import type { Usuario } from './types';
import { ToastContainer, type ToastMessage } from './components/Toast';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { EmpresasView } from './components/EmpresasView';
import { EntrevistasView } from './components/EntrevistasView';
import { BancoPreguntasView } from './components/BancoPreguntasView';
import { ResultadosView } from './components/ResultadosView';
import { DiagnosticoView } from './components/DiagnosticoView';
import { InformesView } from './components/InformesView';
import { UsuariosView } from './components/UsuariosView';
import { EvaluacionPublicaView } from './components/EvaluacionPublicaView';

interface NavItem {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: Array<Usuario['rol']>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Panel Principal', icon: LayoutDashboard, roles: ['ADMINISTRADOR', 'ENTREVISTADOR'] },
  { id: 'empresas', label: 'Empresas', icon: Building2, roles: ['ADMINISTRADOR', 'ENTREVISTADOR'] },
  { id: 'entrevistas', label: 'Entrevistas', icon: ClipboardList, roles: ['ADMINISTRADOR', 'ENTREVISTADOR', 'EVALUADO'] },
  { id: 'banco', label: 'Banco de Preguntas', icon: HelpCircle, roles: ['ADMINISTRADOR'] },
  { id: 'resultados', label: 'Resultados', icon: FileCheck2, roles: ['ADMINISTRADOR', 'ENTREVISTADOR'] },
  { id: 'diagnostico', label: 'Diagnóstico Logístico', icon: Activity, roles: ['ADMINISTRADOR', 'ENTREVISTADOR'] },
  { id: 'informes', label: 'Informes y Exportación', icon: FileBarChart, roles: ['ADMINISTRADOR', 'ENTREVISTADOR'] },
  { id: 'usuarios', label: 'Usuarios', icon: Users, roles: ['ADMINISTRADOR'] },
];

export default function App() {
  const [user, setUser] = useState<Usuario | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openInterviewId, setOpenInterviewId] = useState<number | null>(null);

  const [publicToken, setPublicToken] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('evaluacion');
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const notify = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setCheckingSession(false);
      return;
    }
    apiFetch<{ user: Usuario }>('/api/auth/me')
      .then((res) => {
        setUser(res.user);
        if (res.user.rol === 'EVALUADO') {
          setActiveTab('entrevistas');
        }
      })
      .catch(() => {
        setStoredToken(null);
      })
      .finally(() => setCheckingSession(false));
  }, []);

  const handleLogout = () => {
    setStoredToken(null);
    setUser(null);
    setActiveTab('dashboard');
  };

  if (publicToken) {
    return (
      <>
        <EvaluacionPublicaView
          token={publicToken}
          onExit={() => {
            setPublicToken(null);
            window.history.replaceState({}, '', '/');
          }}
          onNotify={notify}
        />
        <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
      </>
    );
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500">
        Verificando sesión...
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LoginView
          onLoginSuccess={(loggedUser) => {
            setUser(loggedUser);
            setActiveTab(loggedUser.rol === 'EVALUADO' ? 'entrevistas' : 'dashboard');
            notify('success', `Bienvenido, ${loggedUser.nombre}.`);
          }}
          onOpenToken={(token) => setPublicToken(token)}
        />
        <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
      </>
    );
  }

  const allowedNav = NAV_ITEMS.filter((item) => item.roles.includes(user.rol));
  const currentNavLabel = allowedNav.find((n) => n.id === activeTab)?.label || 'Sistema de Diagnóstico';

  const handleOpenInterviewFromCompany = (id: number) => {
    setOpenInterviewId(id);
    setActiveTab('entrevistas');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-[#0F2942] text-white border-r border-slate-800">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-sky-300" />
            </div>
            <span className="text-sm font-bold leading-tight tracking-tight">
              Sistema de Diagnóstico Empresarial
            </span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {allowedNav.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="text-xs">
            <p className="font-semibold text-white truncate">{user.nombre}</p>
            <p className="text-slate-400 font-mono text-[11px]">{user.rol}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-200 bg-white/5 hover:bg-white/15 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-950/50" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative w-64 max-w-[80vw] bg-[#0F2942] text-white flex flex-col z-50">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <span className="text-sm font-bold">Diagnóstico Empresarial</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {allowedNav.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      active ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t border-white/10">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-200 bg-white/10 rounded-lg"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg"
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-400 hidden sm:inline">Sistema de Diagnóstico Empresarial</span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="font-semibold text-slate-900 truncate">{currentNavLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0 text-xs text-slate-600">
            <span className="hidden sm:inline">
              {user.nombre} <span className="text-slate-400">·</span>{' '}
              <span className="font-mono text-[#0F2942] font-semibold">{user.rol}</span>
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-[1440px] w-full mx-auto">
          {activeTab === 'dashboard' && user.rol !== 'EVALUADO' && (
            <DashboardView user={user} onNavigate={setActiveTab} />
          )}
          {activeTab === 'empresas' && user.rol !== 'EVALUADO' && (
            <EmpresasView
              user={user}
              onNotify={notify}
              onOpenInterview={handleOpenInterviewFromCompany}
            />
          )}
          {activeTab === 'entrevistas' && (
            <EntrevistasView
              user={user}
              initialOpenId={openInterviewId}
              onClearInitialOpen={() => setOpenInterviewId(null)}
              onOpenBancoPreguntas={() => setActiveTab('banco')}
              onNotify={notify}
            />
          )}
          {activeTab === 'banco' && user.rol === 'ADMINISTRADOR' && (
            <BancoPreguntasView onNotify={notify} />
          )}
          {activeTab === 'resultados' && user.rol !== 'EVALUADO' && (
            <ResultadosView user={user} onNotify={notify} />
          )}
          {activeTab === 'diagnostico' && user.rol !== 'EVALUADO' && (
            <DiagnosticoView user={user} onNotify={notify} />
          )}
          {activeTab === 'informes' && user.rol !== 'EVALUADO' && (
            <InformesView onNotify={notify} />
          )}
          {activeTab === 'usuarios' && user.rol === 'ADMINISTRADOR' && (
            <UsuariosView currentUser={user} onNotify={notify} />
          )}
        </main>
      </div>

      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
    </div>
  );
}
