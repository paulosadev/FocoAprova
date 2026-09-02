import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

export interface Profile {
  id: string;
  nome: string | null;
  sobrenome: string | null;
  data_nascimento: string | null;
  objetivo_categoria: 'concurso' | 'faculdade' | 'ensino_medio' | 'curso' | 'outro' | null;
  objetivo_descricao: string | null;
  objetivo_perguntado: boolean;
  data_prova: string | null;
  meta_diaria: number;
  created_at: string;
}

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  carregando: boolean;
  sair: () => Promise<void>;
  atualizarPerfil: (campos: Partial<Profile>) => Promise<{ error: any }>;
  recarregarPerfil: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCarregando(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      setSession(novaSessao);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      return;
    }
    buscarPerfil();
  }, [session]);

  async function buscarPerfil() {
    if (!session) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (!error) setProfile(data);
  }

  // atualiza um ou mais campos do perfil de uma vez, ex: atualizarPerfil({ nome: 'Ana' })
  async function atualizarPerfil(campos: Partial<Profile>) {
    if (!session) return { error: new Error('Sem sessão ativa') };

    const { error } = await supabase.from('profiles').update(campos).eq('id', session.user.id);

    if (!error) setProfile((atual) => (atual ? { ...atual, ...campos } : atual));
    return { error };
  }

  async function sair() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        carregando,
        sair,
        atualizarPerfil,
        recarregarPerfil: buscarPerfil,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
}
