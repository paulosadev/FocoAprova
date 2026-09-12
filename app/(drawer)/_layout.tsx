import { TouchableOpacity } from 'react-native';
import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { router, type Href } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTema } from '../../src/context/ThemeContext';
import { fontes } from '../../src/theme';
import ConteudoDrawer from '../../src/components/ConteudoDrawer';

// garante que a tela inicial do drawer é sempre a Início (index), mesmo com
// rotas que ordenam antes dela no alfabeto (ajuda, configuracoes)
export const unstable_settings = { initialRouteName: 'index' };

export default function DrawerLayout() {
  const { cores } = useTema();

  const botaoVoltar = () => (
    <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={{ marginLeft: 16 }}>
      <Ionicons name="chevron-back" size={24} color={cores.textoSecundario} />
    </TouchableOpacity>
  );
  const subTela = (title: string) => ({ title, headerLeft: botaoVoltar, swipeEnabled: false });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <ConteudoDrawer {...props} />}
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: cores.superficie },
          headerTintColor: cores.texto,
          headerTitleStyle: { fontFamily: fontes.displaySemi, fontSize: 18 },
          headerShadowVisible: false,
          drawerStyle: { backgroundColor: cores.superficie, width: 296 },
        }}
      >
        <Drawer.Screen name="index" options={{ title: 'Início' }} />
        <Drawer.Screen name="estudar" options={{ title: 'Estudar', headerShown: false }} />
        <Drawer.Screen name="revisar" options={{ title: 'Revisar', headerShown: false }} />
        <Drawer.Screen name="progresso" options={{ title: 'Progresso' }} />
        <Drawer.Screen
          name="perfil"
          options={{
            title: 'Perfil',
            headerRight: () => (
              <TouchableOpacity
                onPress={() => router.push('/configuracoes' as Href)}
                hitSlop={12}
                style={{ marginRight: 16 }}
              >
                <Ionicons name="settings-outline" size={22} color={cores.textoSecundario} />
              </TouchableOpacity>
            ),
          }}
        />
        <Drawer.Screen name="configuracoes" options={subTela('Configurações')} />
        <Drawer.Screen name="ajuda" options={subTela('Ajuda')} />
        <Drawer.Screen name="trocar-senha" options={subTela('Trocar senha')} />
        <Drawer.Screen name="trocar-email" options={subTela('Trocar e-mail')} />
      </Drawer>
    </GestureHandlerRootView>
  );
}
