import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTema } from '../../src/context/ThemeContext';

export default function DrawerLayout() {
  const { cores } = useTema();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: cores.superficie },
          headerTintColor: cores.texto,
          drawerStyle: { backgroundColor: cores.superficie, width: 260 },
          drawerActiveTintColor: cores.destaque,
          drawerInactiveTintColor: cores.textoSecundario,
          drawerActiveBackgroundColor: cores.superficie2,
          drawerLabelStyle: { fontSize: 15, fontWeight: '600' },
        }}
      >
        <Drawer.Screen
          name="index"
          options={{
            title: 'Início',
            drawerLabel: 'Início',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="timer"
          options={{
            title: 'Timer',
            drawerLabel: 'Timer',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="timer-outline" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="cronograma"
          options={{
            title: 'Cronograma',
            drawerLabel: 'Cronograma',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="calendar-outline" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="questoes"
          options={{
            title: 'Questões',
            drawerLabel: 'Questões',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="help-circle-outline" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="simulado"
          options={{
            title: 'Simulado',
            drawerLabel: 'Simulado',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="stopwatch-outline" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="progresso"
          options={{
            title: 'Progresso',
            drawerLabel: 'Progresso',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="stats-chart-outline" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="perfil"
          options={{
            title: 'Perfil',
            drawerLabel: 'Perfil',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
