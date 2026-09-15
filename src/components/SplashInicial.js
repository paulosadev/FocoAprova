import { Image, StyleSheet, Text, View } from 'react-native';

// fixo (não segue o tema claro/escuro do usuário) — precisa bater com a cor
// nativa da janela travada em app/_layout.tsx (SystemUI.setBackgroundColorAsync),
// senão dá um flash de cor errada antes do tema carregar
const COR_FUNDO = '#0c131b';
const COR_TEXTO = '#e4edf7';

// só o visual do splash — o tempo mínimo é controlado por quem renderiza
// (app/_layout.tsx), pra não depender de callback de animação que pode não
// disparar em alguns aparelhos
export default function SplashInicial() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/logo/logo-mark-escuro.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.nome}>FocoAprova</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // absoluteFillObject sozinho já cobre 100% da janela e acompanha
    // qualquer redimensionamento (ex: barra de tarefas de tablet Samsung
    // mudando o tamanho da janela do app) — um width/height fixo capturado
    // uma vez via Dimensions.get() fica desatualizado nesses casos e cortava
    // o conteúdo centralizado (era a causa real do "A" cortado no splash)
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COR_FUNDO,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 16,
  },
  nome: {
    // NUNCA usar fontes.display (Space Grotesk) aqui — é uma fonte custom
    // carregada de forma assíncrona, e o Splash é exatamente a tela que
    // aparece ENQUANTO ela ainda pode estar carregando. Nesse meio-tempo o
    // Android mede o texto com uma métrica e pinta com outra, cortando a
    // última letra ("FocoAprova" virava "FocoAprov"). Fonte do sistema aqui
    // é sempre síncrona, sem esse risco.
    fontWeight: '700',
    fontSize: 26,
    color: COR_TEXTO,
    letterSpacing: 0.4,
  },
});
