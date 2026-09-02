// conversões de data BR (DD/MM/AAAA) <-> ISO (AAAA-MM-DD), que é o formato do banco

// nunca usar toISOString() aqui, ele vira UTC e adianta o dia perto da meia-noite
export function dataLocalISO(data = new Date()) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

// máscara enquanto digita: "01022001" -> "01/02/2001"
export function mascararDataBR(texto) {
  const numeros = texto.replace(/\D/g, '').slice(0, 8);
  const dia = numeros.slice(0, 2);
  const mes = numeros.slice(2, 4);
  const ano = numeros.slice(4, 8);

  if (numeros.length <= 2) return dia;
  if (numeros.length <= 4) return `${dia}/${mes}`;
  return `${dia}/${mes}/${ano}`;
}

// DD/MM/AAAA -> AAAA-MM-DD, ou null se inválida/incompleta
export function dataBRParaISO(dataBR) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dataBR);
  if (!match) return null;

  const [, diaStr, mesStr, anoStr] = match;
  const dia = Number(diaStr);
  const mes = Number(mesStr);
  const ano = Number(anoStr);

  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  if (ano < 1900 || ano > new Date().getFullYear()) return null;

  // 31/02 não existe, confere se bateu mesmo
  const data = new Date(ano, mes - 1, dia);
  const valida =
    data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;
  if (!valida) return null;

  return `${anoStr}-${mesStr}-${diaStr}`;
}

// ISO -> BR, pra exibir
export function dataISOParaBR(dataISO) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dataISO || '');
  if (!match) return '';
  const [, ano, mes, dia] = match;
  return `${dia}/${mes}/${ano}`;
}

// dias até a data da prova (negativo se já passou)
export function diasRestantes(dataISO) {
  if (!dataISO) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const alvo = new Date(dataISO + 'T00:00:00');
  const diffMs = alvo - hoje;
  return Math.round(diffMs / 86400000);
}
