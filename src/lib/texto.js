// remove números e símbolos de campos de nome, mantendo letras (com acento),
// espaço, apóstrofo e hífen (ex: "D'Angelo", "Ana-Maria")
export function apenasLetras(texto) {
  return texto.replace(/[^\p{L}\s'-]/gu, '');
}
