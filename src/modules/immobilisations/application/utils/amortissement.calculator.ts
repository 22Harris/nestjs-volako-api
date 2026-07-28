import { LigneAmortissement } from '../../domain/entities/immobilisation.entity';

/**
 * Coefficients dégressifs selon l'article 39 A du CGI
 * 3-4 ans → 1.25 | 5-6 ans → 1.75 | >6 ans → 2.25
 */
function coefficientDegressif(duree: number): number {
  if (duree <= 4) return 1.25;
  if (duree <= 6) return 1.75;
  return 2.25;
}

/**
 * Prorata temporis première année en mois (1 à 12).
 * Règle française : si acquisition avant le 16 du mois → mois entier compté ;
 * si le 16 ou après → mois non compté.
 */
function premierAnneeMonths(dateAcquisition: Date): number {
  const mois = dateAcquisition.getMonth() + 1; // 1-12
  const jour = dateAcquisition.getDate();
  const moisComptabilise = jour <= 15 ? mois : mois + 1;
  return Math.max(0, 12 - moisComptabilise + 1);
}

export function calculerTableauAmortissement(
  valeurBrute: number,
  duree: number,
  methode: 'LINEAIRE' | 'DEGRESSIF',
  dateAcquisition: Date,
): LigneAmortissement[] {
  const lignes: LigneAmortissement[] = [];
  const anneeDebut = dateAcquisition.getFullYear();
  const moisPremierAnnee = premierAnneeMonths(dateAcquisition);

  if (methode === 'LINEAIRE') {
    const dotationPleine = Math.round(valeurBrute / duree);
    const dotationPremiere = Math.round((valeurBrute / duree) * (moisPremierAnnee / 12));
    const dotationDerniere = valeurBrute - dotationPremiere - dotationPleine * (duree - 1);

    let cumul = 0;

    for (let i = 0; i < duree + (moisPremierAnnee < 12 ? 1 : 0); i++) {
      let dotation: number;
      if (i === 0) {
        dotation = dotationPremiere;
      } else if (i === duree && moisPremierAnnee < 12) {
        dotation = dotationDerniere;
      } else {
        dotation = dotationPleine;
      }
      if (dotation <= 0) break;
      cumul += dotation;
      if (cumul > valeurBrute) {
        dotation -= cumul - valeurBrute;
        cumul = valeurBrute;
      }
      lignes.push(new LigneAmortissement(
        anneeDebut + i,
        dotation,
        cumul,
        valeurBrute - cumul,
      ));
      if (cumul >= valeurBrute) break;
    }
  } else {
    // Méthode dégressive
    const tauxLineaire = 1 / duree;
    const coeff = coefficientDegressif(duree);
    const tauxDegressif = tauxLineaire * coeff;

    let vnc = valeurBrute;
    let cumul = 0;
    const anneesPrevues = duree + (moisPremierAnnee < 12 ? 1 : 0);

    for (let i = 0; i < anneesPrevues; i++) {
      const anneesRestantes = anneesPrevues - i;
      const tauxLineaireRestant = 1 / anneesRestantes;

      // On bascule en linéaire si le taux linéaire sur VNC restant > taux dégressif
      let dotation: number;
      if (tauxLineaireRestant >= tauxDegressif) {
        dotation = Math.round(vnc / anneesRestantes);
      } else {
        dotation = Math.round(vnc * tauxDegressif);
        // Prorata première année
        if (i === 0 && moisPremierAnnee < 12) {
          dotation = Math.round(dotation * (moisPremierAnnee / 12));
        }
      }

      if (dotation <= 0) break;
      if (cumul + dotation > valeurBrute) dotation = valeurBrute - cumul;
      cumul += dotation;
      vnc -= dotation;

      lignes.push(new LigneAmortissement(
        anneeDebut + i,
        dotation,
        cumul,
        vnc,
      ));
      if (vnc <= 0) break;
    }
  }

  return lignes;
}
