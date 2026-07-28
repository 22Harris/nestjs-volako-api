import type { Ca3Report } from '../../tva.service';

function esc(v: string | number): string {
  return String(v)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function euros(centimes: number): string {
  return (centimes / 100).toFixed(2);
}

/**
 * Génère un XML de déclaration CA3 (format interne — non homologué DGFiP EDI-TVA).
 * Destiné à l'archivage et à l'export comptable.
 */
export function generateCa3Xml(report: Ca3Report, periode: string, userId: number): string {
  const lignesXml = report.tvaCollectee.lignes
    .map(
      l =>
        `    <Ligne code="${esc(l.codeTva)}" taux="${l.taux}" ` +
        `baseHT="${euros(l.baseHt)}" tvaBrute="${euros(l.tvaBrute)}" ` +
        `label="${esc(l.label)}"/>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<DeclarationCA3 version="1.0" xmlns="urn:volako:tva:ca3:1.0">
  <Identification>
    <UserId>${esc(userId)}</UserId>
    <Periode>${esc(periode)}</Periode>
    <DateDebut>${esc(report.dateFrom)}</DateDebut>
    <DateFin>${esc(report.dateTo)}</DateFin>
  </Identification>
  <TVACollectee>
${lignesXml}
    <Total baseHT="${euros(report.tvaCollectee.totalBaseHt)}" tva="${euros(report.tvaCollectee.totalTva)}"/>
  </TVACollectee>
  <TVADeductible>
    <SurImmobilisations>${euros(report.tvaDeductible.surImmobilisations)}</SurImmobilisations>
    <SurAutresBiensServices>${euros(report.tvaDeductible.surAutresBiensServices)}</SurAutresBiensServices>
    <Total>${euros(report.tvaDeductible.total)}</Total>
  </TVADeductible>
  <Solde>
    <SoldeTVA>${euros(report.soldeTva)}</SoldeTVA>
    <TVAAPayer>${euros(report.tvaAPayer)}</TVAAPayer>
    <CreditTVA>${euros(report.creditTva)}</CreditTVA>
  </Solde>
</DeclarationCA3>`;
}
