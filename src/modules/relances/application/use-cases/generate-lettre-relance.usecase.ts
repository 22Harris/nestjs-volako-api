import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { RelanceRepository } from '../ports/relance.repository.interface';
import { RELANCE_REPOSITORY } from '../ports/relance.repository.token';

const TITRES: Record<number, string> = {
  1: 'Rappel de paiement',
  2: 'Deuxième relance',
  3: 'Mise en demeure',
};

const CORPS: Record<number, string> = {
  1: `Nous vous rappelons que la facture ci-dessous est arrivée à échéance et reste impayée.
Nous vous remercions de bien vouloir procéder au règlement dans les meilleurs délais.`,
  2: `Malgré notre précédent rappel, le règlement de la facture ci-dessous n'a toujours pas été reçu.
Nous vous demandons de régulariser cette situation dans un délai de 8 jours.`,
  3: `En l'absence de règlement suite à nos précédentes relances, nous vous mettons en demeure de
procéder au paiement immédiat de la somme due. Passé ce délai de 15 jours, nous nous verrons
contraints d'engager une procédure de recouvrement.`,
};

export interface LettreRelanceResult {
  factureId: number;
  niveau: number;
  tiersNom: string;
  html: string;
}

@Injectable()
export class GenerateLettreRelanceUseCase {
  constructor(@Inject(RELANCE_REPOSITORY) private readonly repo: RelanceRepository) {}

  async execute(factureId: number, userId: number): Promise<LettreRelanceResult> {
    const enRetard = await this.repo.getFacturesEnRetard(userId);
    const facture = enRetard.find(f => f.id === factureId);

    if (!facture) {
      throw new NotFoundException(`Facture #${factureId} introuvable ou non en retard`);
    }

    const niveau = Math.min(facture.niveauRelanceSuivant, 3);
    const titre = TITRES[niveau];
    const corps = CORPS[niveau];
    const montantEuros = (facture.resteAPayer / 100).toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    });
    const echeance = facture.dateEcheance.toLocaleDateString('fr-FR');

    const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>${titre}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 14px; color: #222; max-width: 680px; margin: 40px auto; }
  h1   { font-size: 18px; color: ${niveau === 3 ? '#c0392b' : '#2c3e50'}; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  th,td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
  th    { background: #f4f4f4; }
  .retard { color: #c0392b; font-weight: bold; }
  .footer { margin-top: 40px; font-size: 12px; color: #666; }
</style>
</head>
<body>
  <p><strong>${facture.tiersNom}</strong></p>
  <h1>${titre}</h1>
  <p>${corps.replaceAll('\n', '<br>')}</p>
  <table>
    <tr><th>Facture</th><th>Échéance</th><th>Retard</th><th>Montant restant dû</th></tr>
    <tr>
      <td>${facture.numero}</td>
      <td>${echeance}</td>
      <td class="retard">${facture.joursRetard} jour(s)</td>
      <td class="retard">${montantEuros}</td>
    </tr>
  </table>
  <p>Nous restons à votre disposition pour tout renseignement.</p>
  <div class="footer">Document généré le ${new Date().toLocaleDateString('fr-FR')}</div>
</body>
</html>`;

    return { factureId, niveau, tiersNom: facture.tiersNom, html };
  }
}
