/**
 * Janela da trava de análise (research.md R-09): enquanto `analiseIniciadaEm` for mais recente
 * que isto, existe uma análise em andamento. Passou disso, a trava é considerada abandonada
 * (ex.: o servidor caiu no meio) e uma nova análise pode começar.
 * Usada pelo serviço de análise (para travar) e pelo GET do contrato (para informar a tela).
 */
export const JANELA_TRAVA_ANALISE_MS = 60_000;

/** A trava ainda vale? `iniciadaEm` é o `analiseIniciadaEm` do contrato. */
export function analiseEmAndamento(iniciadaEm: Date | null, agora: Date = new Date()): boolean {
  return iniciadaEm !== null && agora.getTime() - iniciadaEm.getTime() < JANELA_TRAVA_ANALISE_MS;
}
