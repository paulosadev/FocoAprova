import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { coresClaras, coresEscuras } from '../theme';

export type Modo = 'light' | 'dark' | 'system';
export type ModoEfetivo = 'light' | 'dark';
export type Cores = typeof coresEscuras;

interface ThemeContextValue {
  modo: Modo;
  modoEfetivo: ModoEfetivo;
  setModo: (modo: Modo) => Promise<void>;
  cores: Cores;
  carregado: boolean;
}

const CHAVE_STORAGE = '@focoaprova_tema';
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const temaDoSistema = useColorScheme(); // 'light' | 'dark' | null
  const [modo, setModoState] = useState<Modo>('system');
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(CHAVE_STORAGE).then((valorSalvo) => {
      if (valorSalvo === 'light' || valorSalvo === 'dark' || valorSalvo === 'system') {
        setModoState(valorSalvo);
      }
      setCarregado(true);
    });
  }, []);

  async function setModo(novoModo: Modo) {
    setModoState(novoModo);
    try {
      await AsyncStorage.setItem(CHAVE_STORAGE, novoModo);
    } catch (erro) {
      // se não conseguir salvar, a preferência só vale pra essa sessão
    }
  }

  const modoEfetivo: ModoEfetivo = modo === 'system' ? temaDoSistema || 'dark' : modo;
  const cores = modoEfetivo === 'light' ? coresClaras : coresEscuras;

  return (
    <ThemeContext.Provider value={{ modo, modoEfetivo, setModo, cores, carregado }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTema(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTema deve ser usado dentro de ThemeProvider');
  return context;
}
