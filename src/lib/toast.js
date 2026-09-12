// API imperativa de toast, no espírito do Sonner: sem hook, sem contexto —
// importa e chama de qualquer lugar. O host real é montado uma vez em
// app/_layout.tsx e se registra aqui.
let manipulador = null;

export function registrarToastHost(fn) {
  manipulador = fn;
}

export function mostrarToast(mensagem, tipo = 'sucesso') {
  manipulador?.(mensagem, tipo);
}
