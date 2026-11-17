import { useState, type FormEvent } from 'react';
import {
  Lock,
  Unlock,
  HelpCircle,
  Building2,
  ClipboardList,
  FileCheck2,
  ShieldCheck,
  ArrowRight,
  PanelLeft,
} from 'lucide-react';
import { apiFetch, setStoredToken } from '../utils/api';
import type { PestanaMenu, Usuario } from '../types';
import { BancoPreguntasView } from './BancoPreguntasView';
import { EmpresasView } from './EmpresasView';
import { EntrevistasView } from './EntrevistasView';
import { ResultadosView } from './ResultadosView';
import { AdminTabsManager } from './AdminTabsManager';

interface AdminViewProps {
  isAdmin: boolean;
  adminUser: Usuario;
  tabs: PestanaMenu[];
  onTabsChanged: () => Promise<void>;
  onUnlockSuccess: () => void;
  onLockAdmin: () => void;
  onOpenInterview: (entrevistaId: number) => void;
  onNotify: (type: 'success' | 'error' | 'info', msg: string) => void;
}

type AdminSubTab = 'banco' | 'pestanas' | 'empresas' | 'entrevistas' | 'resultados';

export function AdminView({
  isAdmin,
  adminUser,
  tabs,
  onTabsChanged,
  onUnlockSuccess,
  onLockAdmin,
  onOpenInterview,
  onNotify,
}: AdminViewProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [subTab, setSubTab] = useState<AdminSubTab>('banco');

  const handleUnlock = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch<{ token: string; user: Usuario }>('/api/admin/unlock', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      setStoredToken(res.token);
      setPassword('');
      onUnlockSuccess();
      onNotify('success', 'Modo Administrador desbloqueado. Ya puede editar preguntas, pestañas y registros.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Contraseña incorrecta.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-7 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#0F2942] text-white flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Administración y Edición</h2>
              <p className="text-xs text-slate-500">Acceso protegido por contraseña</p>
            </div>
          </div>

          <p className="text-sm text-slate-600 mb-5 leading-relaxed">
            Ingrese la contraseña de administrador para gestionar el banco de preguntas, editar o agregar pestañas del menú lateral, editar empresas, modificar entrevistas y actualizar resultados.
          </p>

          {error && (
            <div className="mb-4 px-3.5 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Contraseña de administrador
              </label>
              <input
                type="password"
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingrese la contraseña"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#0F2942] hover:bg-[#173B5E] text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Unlock className="w-4 h-4" />
              <span>{loading ? 'Verificando...' : 'Desbloquear administración'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  const adminTabs: Array<{ id: AdminSubTab; label: string; icon: typeof HelpCircle }> = [
    { id: 'banco', label: 'Preguntas y Módulos', icon: HelpCircle },
    { id: 'pestanas', label: 'Pestañas del Menú', icon: PanelLeft },
    { id: 'empresas', label: 'Editar Empresas', icon: Building2 },
    { id: 'entrevistas', label: 'Editar Entrevistas', icon: ClipboardList },
    { id: 'resultados', label: 'Editar Resultados', icon: FileCheck2 },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-[#0F2942] text-white rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-sky-300" />
          </div>
          <div>
            <h2 className="text-base font-bold">Panel de Administración y Edición Total</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Todas las funciones de edición de preguntas, pestañas del menú, empresas, entrevistas y resultados están habilitadas.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onLockAdmin}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/15 rounded-lg transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Bloquear edición</span>
        </button>
      </div>

      {/* Sub-navigation tabs inside Admin */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {adminTabs.map((t) => {
          const Icon = t.icon;
          const active = subTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                active
                  ? 'bg-[#0F2942] text-white'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {subTab === 'banco' && <BancoPreguntasView onNotify={onNotify} />}
      {subTab === 'pestanas' && (
        <AdminTabsManager tabs={tabs} onTabsChanged={onTabsChanged} onNotify={onNotify} />
      )}
      {subTab === 'empresas' && (
        <EmpresasView
          user={adminUser}
          onNotify={onNotify}
          onOpenInterview={onOpenInterview}
        />
      )}
      {subTab === 'entrevistas' && (
        <EntrevistasView
          user={adminUser}
          onOpenBancoPreguntas={() => setSubTab('banco')}
          onNotify={onNotify}
        />
      )}
      {subTab === 'resultados' && (
        <ResultadosView user={adminUser} onNotify={onNotify} />
      )}
    </div>
  );
}
