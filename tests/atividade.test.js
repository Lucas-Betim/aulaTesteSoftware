// Aluno: Lucas Betim Nobre de Oliveira

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { avaliarPedidoEmprestimo } = require('../src/emprestimo');
const { CarteiraDigital } = require('../src/carteira');
const { gerarMensagemNotificacao } = require('../src/notificador');

/**
 * CT-01 | RF-01 | Análise de valor-limite
 * Entrada: avaliarPedidoEmprestimo(17, 2000)
 * Esperado: rejeitado por idade fora do limite.
 * Obtido: rejeitado por idade fora do limite.
 * Situação: Passou
 */
test('CT-01 RF-01: idade 17 é rejeitada', () => {
  assert.deepEqual(avaliarPedidoEmprestimo(17, 2000), {
    aprovado: false,
    motivo: 'IDADE_FORA_DO_LIMITE',
    limiteCredito: null,
  });
});

/**
 * CT-02 | RF-01 | Análise de valor-limite
 * Entrada: avaliarPedidoEmprestimo(18, 1200)
 * Esperado: aprovado com limite 2400.
 * Obtido: rejeitado por renda insuficiente.
 * Situação: Falhou
 * Defeito: emprestimo.js rejeita a renda mínima inclusiva usando <= em vez de <.
 */
test('CT-02 RF-01: idade 18 e renda 1200 são aceitas', () => {
  assert.deepEqual(avaliarPedidoEmprestimo(18, 1200), {
    aprovado: true,
    motivo: null,
    limiteCredito: 2400,
  });
});

/**
 * CT-03 | RF-01 | Análise de valor-limite
 * Entrada: avaliarPedidoEmprestimo(70, 3000)
 * Esperado: aprovado com limite 4500, incluindo redução para idade >= 65.
 * Obtido: aprovado com limite 4500.
 * Situação: Passou
 */
test('CT-03 RF-01: idade 70 é aceita e recebe redução de limite', () => {
  assert.deepEqual(avaliarPedidoEmprestimo(70, 3000), {
    aprovado: true,
    motivo: null,
    limiteCredito: 4500,
  });
});

/**
 * CT-04 | RF-01 | Análise de valor-limite
 * Entrada: avaliarPedidoEmprestimo(71, 2000)
 * Esperado: rejeitado por idade fora do limite.
 * Obtido: rejeitado por idade fora do limite.
 * Situação: Passou
 */
test('CT-04 RF-01: idade 71 é rejeitada', () => {
  assert.equal(avaliarPedidoEmprestimo(71, 2000).motivo, 'IDADE_FORA_DO_LIMITE');
});

/**
 * CT-05 | RF-01 | Análise de valor-limite
 * Entrada: avaliarPedidoEmprestimo(30, 2999.99)
 * Esperado: aprovado com limite 5999.98.
 * Obtido: aprovado com limite 5999.98.
 * Situação: Passou
 */
test('CT-05 RF-01: renda imediatamente abaixo de 3000 usa multiplicador 2', () => {
  assert.equal(avaliarPedidoEmprestimo(30, 2999.99).limiteCredito, 5999.98);
});

/**
 * CT-06 | RF-01 | Análise de valor-limite
 * Entrada: avaliarPedidoEmprestimo(30, 3000)
 * Esperado: aprovado com limite 9000.
 * Obtido: aprovado com limite 9000.
 * Situação: Passou
 */
test('CT-06 RF-01: renda 3000 inicia a faixa de multiplicador 3', () => {
  assert.equal(avaliarPedidoEmprestimo(30, 3000).limiteCredito, 9000);
});

/**
 * CT-07 | RF-01 | Análise de valor-limite
 * Entrada: avaliarPedidoEmprestimo(30, 7999.99)
 * Esperado: aprovado com limite 23999.97.
 * Obtido: aprovado com limite 23999.97.
 * Situação: Passou
 */
test('CT-07 RF-01: renda imediatamente abaixo de 8000 permanece na faixa 3', () => {
  assert.equal(avaliarPedidoEmprestimo(30, 7999.99).limiteCredito, 23999.97);
});

/**
 * CT-08 | RF-01 | Análise de valor-limite
 * Entrada: avaliarPedidoEmprestimo(30, 8000)
 * Esperado: aprovado com limite 40000.
 * Obtido: aprovado com limite 32000.
 * Situação: Falhou
 * Defeito: emprestimo.js usa multiplicador 4 na faixa a partir de 8000; a especificação exige 5.
 */
test('CT-08 RF-01: renda 8000 inicia a faixa de multiplicador 5', () => {
  assert.equal(avaliarPedidoEmprestimo(30, 8000).limiteCredito, 40000);
});

/**
 * CT-09 | RF-01 | Teste de condição
 * Entrada: avaliarPedidoEmprestimo(65, 4500)
 * Esperado: aprovado com limite 6750 após redução pela metade.
 * Obtido: aprovado com limite 6750.
 * Situação: Passou
 */
test('CT-09 RF-01: idade 65 reduz o limite calculado pela metade', () => {
  assert.equal(avaliarPedidoEmprestimo(65, 4500).limiteCredito, 6750);
});

/**
 * CT-10 | RF-02 | Análise de valor-limite
 * Entrada: carteira.abrir(0)
 * Esperado: carteira aberta com saldo 0.
 * Obtido: carteira aberta com saldo 0.
 * Situação: Passou
 */
test('CT-10 RF-02: saldo inicial zero é aceito', () => {
  const carteira = new CarteiraDigital();
  carteira.abrir(0);
  assert.equal(carteira.obterSaldo(), 0);
});

/**
 * CT-11 | RF-02 a RF-07/RNF-01 | Teste orientado a objetos e fluxo de dados
 * Entrada: abrir(100) -> depositar(50) -> sacar(30) -> aplicarJuros(10) -> fechar()
 * Esperado: saldo final 132, sem saldo negativo.
 * Obtido: saldo final 132.
 * Situação: Passou
 */
test('CT-11 RF-02..RF-07/RNF-01: sequência completa da carteira', () => {
  const carteira = new CarteiraDigital();
  carteira.abrir(100);
  carteira.depositar(50);
  carteira.sacar(30);
  carteira.aplicarJuros(10);
  assert.equal(carteira.fechar(), 132);
  assert.equal(carteira.obterSaldo() >= 0, true);
});

/**
 * CT-12 | RF-04 | Análise de valor-limite
 * Entrada: abrir(100) -> sacar(100)
 * Esperado: saque aceito e saldo 0.
 * Obtido: saque aceito e saldo 0.
 * Situação: Passou
 */
test('CT-12 RF-04: saque exatamente igual ao saldo é aceito', () => {
  const carteira = new CarteiraDigital();
  carteira.abrir(100);
  carteira.sacar(100);
  assert.equal(carteira.obterSaldo(), 0);
});

/**
 * CT-13 | RF-05 | Análise de valor-limite
 * Entrada: abrir(100) -> aplicarJuros(0)
 * Esperado: saldo 100.
 * Obtido: saldo 100.
 * Situação: Passou
 */
test('CT-13 RF-05: taxa zero é aceita', () => {
  const carteira = new CarteiraDigital();
  carteira.abrir(100);
  carteira.aplicarJuros(0);
  assert.equal(carteira.obterSaldo(), 100);
});

/**
 * CT-14 | RF-05 | Análise de valor-limite
 * Entrada: abrir(100) -> aplicarJuros(100)
 * Esperado: saldo 200.
 * Obtido: saldo 200.
 * Situação: Passou
 */
test('CT-14 RF-05: taxa 100 por cento é aceita', () => {
  const carteira = new CarteiraDigital();
  carteira.abrir(100);
  carteira.aplicarJuros(100);
  assert.equal(carteira.obterSaldo(), 200);
});

/**
 * CT-15 | RF-05 | Particionamento de equivalência
 * Entrada: abrir(100) -> aplicarJuros(101)
 * Esperado: erro TAXA_INVALIDA.
 * Obtido: operação aceita e saldo 201.
 * Situação: Falhou
 * Defeito: carteira.js não valida o limite superior de 100% para a taxa.
 */
test('CT-15 RF-05: taxa acima de 100 por cento é rejeitada', () => {
  const carteira = new CarteiraDigital();
  carteira.abrir(100);
  assert.throws(() => carteira.aplicarJuros(101), { message: 'TAXA_INVALIDA' });
});

/**
 * CT-16 | RF-02 | Particionamento de equivalência
 * Entrada: abrir(-1)
 * Esperado: erro SALDO_INICIAL_INVALIDO.
 * Obtido: erro SALDO_INICIAL_INVALIDO.
 * Situação: Passou
 */
test('CT-16 RF-02: saldo inicial negativo é rejeitado', () => {
  const carteira = new CarteiraDigital();
  assert.throws(() => carteira.abrir(-1), { message: 'SALDO_INICIAL_INVALIDO' });
});

/**
 * CT-17 | RF-06 | Teste de estados
 * Entrada: depositar, sacar, aplicarJuros e fechar antes de abrir.
 * Esperado: todas as operações são rejeitadas com CARTEIRA_FECHADA ou CARTEIRA_JA_FECHADA.
 * Obtido: conforme esperado.
 * Situação: Passou
 */
test('CT-17 RF-06: operações fora de ordem são rejeitadas', () => {
  const carteira = new CarteiraDigital();
  assert.throws(() => carteira.depositar(10), { message: 'CARTEIRA_FECHADA' });
  assert.throws(() => carteira.sacar(10), { message: 'CARTEIRA_FECHADA' });
  assert.throws(() => carteira.aplicarJuros(10), { message: 'CARTEIRA_FECHADA' });
  assert.throws(() => carteira.fechar(), { message: 'CARTEIRA_JA_FECHADA' });
});

/**
 * CT-18 | RF-08 | Teste de componentes/interface
 * Entrada: gerarMensagemNotificacao(avaliarPedidoEmprestimo(17, 2000))
 * Esperado: "Empréstimo não aprovado. Motivo: IDADE_FORA_DO_LIMITE".
 * Obtido: erro RESULTADO_INVALIDO.
 * Situação: Falhou
 * Defeito: notificador.js rejeita o motivo codificado produzido por emprestimo.js.
 */
test('CT-18 RF-08: notificador aceita o resultado real de uma rejeição', () => {
  const resultado = avaliarPedidoEmprestimo(17, 2000);
  assert.equal(
    gerarMensagemNotificacao(resultado),
    'Empréstimo não aprovado. Motivo: IDADE_FORA_DO_LIMITE',
  );
});

/**
 * CT-19 | RF-08 | Teste de componentes/interface
 * Entrada: gerarMensagemNotificacao(avaliarPedidoEmprestimo(45, 4500))
 * Esperado: mensagem de aprovação com limite R$ 13500.00.
 * Obtido: mensagem de aprovação com limite R$ 13500.00.
 * Situação: Passou
 */
test('CT-19 RF-08: notificador consome resultado real de aprovação', () => {
  const resultado = avaliarPedidoEmprestimo(45, 4500);
  assert.equal(
    gerarMensagemNotificacao(resultado),
    'Empréstimo aprovado! Limite de crédito: R$ 13500.00',
  );
});

/**
 * CT-20 | RF-08 | Teste de condição
 * Entrada: gerarMensagemNotificacao({ aprovado: true, motivo: null })
 * Esperado: erro RESULTADO_INVALIDO.
 * Obtido: erro RESULTADO_INVALIDO.
 * Situação: Passou
 */
test('CT-20 RF-08: aprovação sem limite de crédito é inválida', () => {
  assert.throws(
    () => gerarMensagemNotificacao({ aprovado: true, motivo: null }),
    { message: 'RESULTADO_INVALIDO' },
  );
});

/**
 * CT-21 | RF-09 | Teste de sistema/cenário de aceitação
 * Entrada: node index.js emprestimo 45 4500
 * Esperado: aprovação com limite R$ 13500.00 e código 0.
 * Obtido: aprovação com limite R$ 13500.00 e código 0.
 * Situação: Passou
 */
test('CT-21 RF-09: cenário da Maria funciona pela CLI', () => {
  const resultado = spawnSync(process.execPath, ['index.js', 'emprestimo', '45', '4500'], {
    encoding: 'utf8',
  });
  assert.equal(resultado.status, 0);
  assert.equal(resultado.stdout.trim(), 'Empréstimo aprovado! Limite de crédito: R$ 13500.00');
});

/**
 * CT-22 | RF-09 | Teste de sistema/interface
 * Entrada: node index.js emprestimo 17 2000
 * Esperado: rejeição com motivo IDADE_FORA_DO_LIMITE e código 0.
 * Obtido: erro RESULTADO_INVALIDO e código 1.
 * Situação: Falhou
 * Defeito: a integração da CLI com o notificador falha para rejeições reais do empréstimo.
 */
test('CT-22 RF-09: CLI exibe rejeição de empréstimo', () => {
  const resultado = spawnSync(process.execPath, ['index.js', 'emprestimo', '17', '2000'], {
    encoding: 'utf8',
  });
  assert.equal(resultado.status, 0);
  assert.equal(
    resultado.stdout.trim(),
    'Empréstimo não aprovado. Motivo: IDADE_FORA_DO_LIMITE',
  );
});
