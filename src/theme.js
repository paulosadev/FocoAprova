// paletas escura (padrão) e clara — usar via useTema(), não importar direto

export const coresEscuras = {
  fundo: '#0c131b',
  superficie: '#141d27',
  superficie2: '#1a2530',
  borda: '#28394a',
  texto: '#e4edf7',
  textoSecundario: '#93aac2',
  textoFraco: '#64798e',
  destaque: '#9bcbff',
  destaqueTexto: '#042c53',
  ambar: '#efaf3f',
  ambarTexto: '#2b1d02',
  perigo: '#e07a6f',
  sucesso: '#5bc48a',
};

export const coresClaras = {
  fundo: '#eef2f7',
  superficie: '#ffffff',
  superficie2: '#dde5ee',
  borda: '#93a8c2',
  texto: '#1f2a35',
  textoSecundario: '#556575',
  textoFraco: '#8697a8',
  destaque: '#185fa5',
  destaqueTexto: '#eaf3ff',
  ambar: '#9c6a13',
  ambarTexto: '#fff6e8',
  perigo: '#a32d2d',
  sucesso: '#1f7a4d',
};

export const espacamento = {
  p: 16,
  pequeno: 8,
  medio: 16,
  grande: 24,
  extra: 32,
};

export const raio = {
  padrao: 10,
  pequeno: 6,
  botao: 8,
};

// Space Grotesk carregada em app/_layout.tsx — usar só em títulos e números
// de destaque; o texto corrido segue na fonte do sistema
export const fontes = {
  display: 'SpaceGrotesk_700Bold',
  displaySemi: 'SpaceGrotesk_600SemiBold',
};

// profundidade entre camadas de cards (iOS usa shadow*, Android usa elevation)
export const sombra = {
  cartao: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 4,
  },
};
