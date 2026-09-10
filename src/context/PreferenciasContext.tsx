import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { carregarSomAtivado, salvarSomAtivado } from '../lib/preferencias';

interface PreferenciasContextValue {
  somAtivado: boolean;
  setSomAtivado: (valor: boolean) => Promise<void>;
}

const PreferenciasContext = createContext<PreferenciasContextValue | undefined>(undefined);

export function PreferenciasProvider({ children }: { children: ReactNode }) {
  const [somAtivado, setSomAtivadoState] = useState(true);

  useEffect(() => {
    carregarSomAtivado().then(setSomAtivadoState);
  }, []);

  async function setSomAtivado(valor: boolean) {
    setSomAtivadoState(valor);
    await salvarSomAtivado(valor);
  }

  return (
    <PreferenciasContext.Provider value={{ somAtivado, setSomAtivado }}>
      {children}
    </PreferenciasContext.Provider>
  );
}

export function usePreferencias(): PreferenciasContextValue {
  const context = useContext(PreferenciasContext);
  if (!context) throw new Error('usePreferencias deve ser usado dentro de PreferenciasProvider');
  return context;
}
