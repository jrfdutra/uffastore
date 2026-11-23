import {
  findNpsCandidates,
  markNpsInvited,
  type NpsOrder,
  npsWindow,
  unmarkNpsInvited,
} from "./nps-core.ts";
import { createNpsLink } from "./nps-link.ts";
import type { AdminGraphql } from "./shopify-admin";

export type NpsRunResult = {
  success: boolean;
  dryRun: boolean;
  window: { start: string; end: string };
  scanned: number;
  invited: number;
  sent: number;
  failed: number;
  /** Convites cuja marcação foi desfeita após falha de e-mail (nova tentativa possível). */
  pendingRetry: number;
  orderNumbers: string[];
};

export type NpsRunDeps = {
  graphql: AdminGraphql;
  send: (order: NpsOrder, url: string) => Promise<{ success: boolean }>;
  origin: string;
  secret: string;
  now: number;
  dryRun: boolean;
};

/** Executa um disparo: encontra encomendas, marca o convite e envia o link. */
export async function runNps(deps: NpsRunDeps): Promise<NpsRunResult> {
  const window = npsWindow(deps.now);
  const result: NpsRunResult = {
    success: true,
    dryRun: deps.dryRun,
    window: {
      start: new Date(window.start).toISOString(),
      end: new Date(window.end).toISOString(),
    },
    scanned: 0,
    invited: 0,
    sent: 0,
    failed: 0,
    pendingRetry: 0,
    orderNumbers: [],
  };

  const candidates = await findNpsCandidates(deps.graphql, deps.now);
  result.scanned = candidates.length;

  for (const order of candidates) {
    const token = createNpsLink(
      { orderId: order.id, orderNumber: order.name },
      deps.secret,
      deps.now,
    );
    const url = `${deps.origin}/avaliar?token=${encodeURIComponent(token)}`;

    if (deps.dryRun) {
      // Não escreve metafields nem envia e-mails: apenas mostra o que seria feito.
      result.orderNumbers.push(order.name);
      continue;
    }

    let metafieldId: string | null = null;
    try {
      metafieldId = await markNpsInvited(deps.graphql, order.id, deps.now);
    } catch (error) {
      result.failed += 1;
      console.error(`[NPS] Falha ao marcar ${order.name}:`, error);
      continue;
    }
    result.invited += 1;

    let delivered = false;
    try {
      const sent = await deps.send(order, url);
      delivered = sent.success;
      if (delivered) {
        result.sent += 1;
        result.orderNumbers.push(order.name);
      } else {
        result.failed += 1;
        console.error(`[NPS] Falha ao enviar convite para ${order.name}`);
      }
    } catch (error) {
      result.failed += 1;
      console.error(`[NPS] Erro ao enviar convite para ${order.name}:`, error);
    }

    // Sem e-mail, a marcação não deve impedir uma nova tentativa no próximo dia.
    if (!delivered) {
      try {
        await unmarkNpsInvited(deps.graphql, order.id, metafieldId);
        result.pendingRetry += 1;
      } catch (error) {
        console.error(`[NPS] Falha ao libertar ${order.name} para nova tentativa:`, error);
      }
    }
  }

  result.success = result.failed === 0;
  return result;
}
