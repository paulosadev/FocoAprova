import { Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

// fixo (não segue o tema claro/escuro do usuário) — precisa bater com a cor
// nativa da janela travada em app/_layout.tsx (SystemUI.setBackgroundColorAsync),
// senão dá um flash de cor errada antes do tema carregar
const COR_FUNDO = '#0c131b';
const COR_TEXTO = '#e4edf7';

// só o visual do splash — o tempo mínimo é controlado por quem renderiza
// (app/_layout.tsx), pra não depender de callback de animação que pode não
// disparar em alguns aparelhos
export default function SplashInicial() {
  // largura/altura explícitas (reativas a rotação/resize) em vez de confiar
  // em absoluteFillObject se esticar contra os Providers ancestrais — em
  // alguns aparelhos isso resultava numa caixa do tamanho do conteúdo em vez
  // da tela inteira, jogando logo+nome pro topo em vez de centralizar
  const { width, height } = useWindowDimensions();

  return (
    <View style={[styles.container, { width, height }]}>
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
    position: 'absolute',
    top: 0,
    left: 0,
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
