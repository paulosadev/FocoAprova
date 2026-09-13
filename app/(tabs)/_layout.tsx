import { Tabs } from 'expo-router';
import BarraAbas from '../../src/components/BarraAbas';

// nav lateral (drawer) trocada por barra inferior com o Timer em destaque no
// centro — cada tela renderiza seu próprio cabeçalho (ver src/components/Cabecalho.js),
// então headerShown fica false em todo lugar aqui.
export const unstable_settings = { initialRouteName: 'index' };

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <BarraAbas {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="revisar" />
      <Tabs.Screen name="estudar" />
      <Tabs.Screen name="progresso" />
      <Tabs.Screen name="perfil" />
    </Tabs>
  );
}
