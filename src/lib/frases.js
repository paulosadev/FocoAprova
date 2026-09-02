import { dataLocalISO } from './data';

// frases motivacionais de domínio público, nada de trecho protegido
export const FRASES = [
  { texto: 'A raiz do estudo é amarga, mas os frutos são doces.', autor: 'Aristóteles' },
  {
    texto: 'Não é o mais forte que sobrevive, nem o mais inteligente, mas o que melhor se adapta.',
    autor: 'Charles Darwin',
  },
  { texto: 'A persistência é o caminho do êxito.', autor: 'Charles Chaplin' },
  {
    texto: 'Não temos que ser melhores que os outros, apenas melhores do que éramos ontem.',
    autor: 'Dalai Lama',
  },
  {
    texto: 'O sucesso é a soma de pequenos esforços repetidos dia após dia.',
    autor: 'Robert Collier',
  },
  {
    texto:
      'Não é o que fazemos de vez em quando que molda nossas vidas, mas o que fazemos consistentemente.',
    autor: 'Tony Robbins',
  },
  {
    texto: 'A educação é a arma mais poderosa que você pode usar para mudar o mundo.',
    autor: 'Nelson Mandela',
  },
  {
    texto: 'Ninguém educa ninguém, ninguém educa a si mesmo, os homens se educam entre si.',
    autor: 'Paulo Freire',
  },
  { texto: 'Não há saber mais ou saber menos: há saberes diferentes.', autor: 'Paulo Freire' },
  {
    texto: 'Uma criança, um professor, um livro e uma caneta podem mudar o mundo.',
    autor: 'Malala Yousafzai',
  },
  { texto: 'Só sei que nada sei.', autor: 'Sócrates' },
  { texto: 'Devagar se vai ao longe.', autor: 'Provérbio popular' },
  {
    texto: 'Feliz aquele que transfere o que sabe e aprende o que ensina.',
    autor: 'Cora Coralina',
  },
  {
    texto: 'A vida não é um problema a ser resolvido, mas uma realidade a ser experimentada.',
    autor: 'Soren Kierkegaard',
  },
  {
    texto:
      'Tudo o que um sonho precisa para ser realizado é alguém que acredite que ele possa ser realizado.',
    autor: 'Roberto Shinyashiki',
  },
  { texto: 'A disciplina é a ponte entre metas e realizações.', autor: 'Jim Rohn' },
  { texto: 'Não espere por circunstâncias ideais. Elas nunca virão.', autor: 'Sêneca' },
  {
    texto: 'É durante a crise que nascem as invenções, os descobrimentos e as grandes estratégias.',
    autor: 'Albert Einstein',
  },
  { texto: 'A imaginação é mais importante que o conhecimento.', autor: 'Albert Einstein' },
  {
    texto:
      'Aprender é a única coisa de que a mente nunca se cansa, nunca tem medo e nunca se arrepende.',
    autor: 'Leonardo da Vinci',
  },
  {
    texto: 'Comece onde você está. Use o que você tem. Faça o que você pode.',
    autor: 'Arthur Ashe',
  },
  {
    texto: 'A queda mais lamentável é a que se dá pelo abandono do próprio ideal.',
    autor: 'Charles Chaplin',
  },
  {
    texto:
      'Você nunca sabe que resultados virão da sua ação. Mas se você não fizer nada, não existirão resultados.',
    autor: 'Mahatma Gandhi',
  },
  {
    texto: 'Não é o mais forte, nem o mais rápido, mas o que persiste, que chega ao fim.',
    autor: 'Confúcio',
  },
  {
    texto: 'Se você quer viver uma vida feliz, ligue-a a uma meta, não a pessoas ou coisas.',
    autor: 'Albert Einstein',
  },
  {
    texto: 'Poucos são os que enxergam com os próprios olhos e sentem com o próprio coração.',
    autor: 'Albert Einstein',
  },
  { texto: 'A repetição legitima.', autor: 'Provérbio popular' },
  { texto: 'Onde há vontade, há um caminho.', autor: 'Provérbio popular' },
  {
    texto: 'O único lugar onde o sucesso vem antes do trabalho é no dicionário.',
    autor: 'Albert Einstein',
  },
  {
    texto: 'Não deixe que a saudade do passado ou o medo do futuro estraguem o presente.',
    autor: 'Marco Aurélio',
  },
  { texto: 'Ninguém baixa a guarda por medo de ferimentos que ainda não tem.', autor: 'Sêneca' },
];

// mesma frase o dia todo, só muda quando vira o dia
export function fraseDoDia() {
  const hoje = dataLocalISO();
  let soma = 0;
  for (let i = 0; i < hoje.length; i++) soma += hoje.charCodeAt(i);
  const indice = soma % FRASES.length;
  return FRASES[indice];
}
