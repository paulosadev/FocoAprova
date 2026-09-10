import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DrawerContentScrollView } from 'expo-router/drawer';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/ThemeContext';
import { fontes } from '../theme';

const SECOES = [
  {
    titulo: null,
    itens: [{ rota: '/', rotulo: 'Início', icone: 'home-outline' }],
  },
  {
    titulo: 'Estudar',
    itens: [
      { rota: '/timer', rotulo: 'Timer', icone: 'timer-outline' },
      { rota: '/cronograma', rotulo: 'Cronograma', icone: 'calendar-outline' },
      { rota: '/simulado', rotulo: 'Simulado', icone: 'stopwatch-outline' },
    ],
  },
  {
    titulo: 'Acompanhar',
    itens: [
      { rota: '/questoes', rotulo: 'Questões', icone: 'help-circle-outline' },
      { rota: '/flashcards', rotulo: 'Flashcards', icone: 'albums-outline' },
      { rota: '/progresso', rotulo: 'Progresso', icone: 'stats-chart-outline' },
    ],
  },
  {
    titulo: 'Conta',
    itens: [{ rota: '/perfil', rotulo: 'Perfil', icone: 'person-outline' }],
  },
];

function iniciais(texto) {
  const partes = texto.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export default function ConteudoDrawer(props) {
  const { cores } = useTema();
  const styles = criarEstilos(cores);
  const router = useRouter();
  const pathname = usePathname();
  const { session, profile } = useAuth();

  const meta = session?.user?.user_metadata ?? {};
  const nomeCompleto =
    [profile?.nome, profile?.sobrenome].filter(Boolean).join(' ') ||
    meta.full_name ||
    meta.name ||
    'Minha conta';
  const email = session?.user?.email ?? '';

  function abrir(rota) {
    props.navigation?.closeDrawer?.();
    if (pathname !== rota) router.push(rota);
  }

  return (
    <View style={styles.container}>
      <DrawerContentScrollView {...props} contentContainerStyle={styles.scroll}>
        <View style={styles.cabecalho}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTexto}>{iniciais(nomeCompleto)}</Text>
          </View>
          <View style={styles.cabecalhoInfo}>
            <Text style={styles.nome} numberOfLines={1}>
              {nomeCompleto}
            </Text>
            {!!email && (
              <Text style={styles.email} numberOfLines={1}>
                {email}
              </Text>
            )}
          </View>
        </View>

        {SECOES.map((secao, i) => (
          <View key={secao.titulo ?? `secao-${i}`} style={styles.secao}>
            {secao.titulo && <Text style={styles.secaoTitulo}>{secao.titulo}</Text>}
            {secao.itens.map((item) => {
              const ativo = pathname === item.rota;
              const cor = ativo ? cores.texto : cores.textoSecundario;
              return (
                <TouchableOpacity
                  key={item.rota}
                  style={[styles.item, ativo && styles.itemAtivo]}
                  onPress={() => abrir(item.rota)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={item.icone} size={20} color={ativo ? cores.destaque : cor} />
                  <Text style={[styles.itemTexto, { color: cor }, ativo && styles.itemTextoAtivo]}>
                    {item.rotulo}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </DrawerContentScrollView>
    </View>
  );
}

function criarEstilos(cores) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: cores.superficie },
    scroll: { paddingBottom: 24 },
    cabecalho: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: cores.borda,
    },
    avatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: cores.destaque,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarTexto: { fontFamily: fontes.display, fontSize: 15, color: cores.destaqueTexto },
    cabecalhoInfo: { flex: 1 },
    nome: { fontSize: 15, fontWeight: '600', color: cores.texto },
    email: { fontSize: 12, color: cores.textoFraco, marginTop: 2 },

    secao: { paddingTop: 14, paddingBottom: 2 },
    secaoTitulo: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: cores.textoFraco,
      paddingHorizontal: 20,
      paddingBottom: 6,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderLeftWidth: 3,
      borderLeftColor: 'transparent',
    },
    itemAtivo: {
      backgroundColor: cores.superficie2,
      borderLeftColor: cores.destaque,
    },
    itemTexto: { fontSize: 14 },
    itemTextoAtivo: { fontWeight: '600' },
  });
}
