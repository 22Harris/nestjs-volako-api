import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { RAPPROCHEMENT_REPOSITORY } from '../ports/rapprochement.repository.token';
import type { RapprochementRepository, JournalLineCandidate } from '../ports/rapprochement.repository.interface';
import type { LigneReleve } from '../../domain/entities/ligne-releve.entity';

export interface MatchCandidate {
  journalLineId: number;
  debit: number;
  credit: number;
  account: { id: number; code: string; name: string };
  entry: { id: number; date: Date; label: string; pieceNumber: string | null };
  score: number;
  reasons: string[];
}

const TOLERANCE_JOURS  = 7;
const TOLERANCE_PCT    = 0.05; // 5 %
const MIN_SCORE_RETURN = 10;

function scoreCandidate(ligne: LigneReleve, jl: JournalLineCandidate): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  const montantAbs = Math.abs(ligne.montant);
  // positive montant = crédit banque = argent entrant → débit en comptabilité (512)
  const isIncoming      = ligne.montant > 0;
  const relevantAmount  = isIncoming ? jl.debit  : jl.credit;
  const oppositeAmount  = isIncoming ? jl.credit : jl.debit;

  // ── Scoring montant ──────────────────────────────────────────────────────────
  const diff    = Math.abs(relevantAmount - montantAbs);
  const pct     = montantAbs > 0 ? diff / montantAbs : 1;
  const diffOpp = Math.abs(oppositeAmount - montantAbs);
  const pctOpp  = montantAbs > 0 ? diffOpp / montantAbs : 1;

  if (diff === 0) {
    score += 60; reasons.push('Montant exact');
  } else if (pct <= 0.005) {
    score += 45; reasons.push('Montant ≈ exact (< 0,5 %)');
  } else if (pct <= 0.02) {
    score += 30; reasons.push('Montant proche (< 2 %)');
  } else if (pct <= 0.05) {
    score += 15; reasons.push('Montant approché (< 5 %)');
  } else if (diffOpp === 0) {
    score += 35; reasons.push('Montant exact (sens opposé)');
  } else if (pctOpp <= 0.02) {
    score += 18; reasons.push('Montant proche — sens opposé');
  }

  // ── Scoring date ─────────────────────────────────────────────────────────────
  const diffMs   = Math.abs(new Date(jl.entry.date).getTime() - new Date(ligne.date).getTime());
  const diffDays = diffMs / 86_400_000;

  if (diffDays === 0) {
    score += 30; reasons.push('Même date');
  } else if (diffDays <= 1) {
    score += 25; reasons.push('Date ±1 j');
  } else if (diffDays <= 3) {
    score += 15; reasons.push('Date ±3 j');
  } else if (diffDays <= 7) {
    score += 5;  reasons.push('Date ±7 j');
  }

  // ── Scoring référence ─────────────────────────────────────────────────────────
  if (ligne.reference && jl.entry.pieceNumber) {
    const ref  = ligne.reference.toLowerCase();
    const piece = jl.entry.pieceNumber.toLowerCase();
    if (ref.includes(piece) || piece.includes(ref)) {
      score += 20; reasons.push('Référence correspondante');
    }
  }

  // ── Scoring libellé (overlap de mots-clés > 3 chars) ─────────────────────────
  const ligneWords = ligne.libelle.toLowerCase().split(/[\s\-_/]+/).filter(w => w.length > 3);
  const entryWords = jl.entry.label.toLowerCase().split(/[\s\-_/]+/).filter(w => w.length > 3);
  const matched = ligneWords.filter(w => entryWords.some(ew => ew.includes(w) || w.includes(ew)));
  if (matched.length > 0) {
    const bonus = Math.min(matched.length * 10, 20);
    score += bonus;
    reasons.push(`Libellé similaire (${matched.slice(0, 2).join(', ')})`);
  }

  return { score, reasons };
}

@Injectable()
export class FindMatchCandidatesUseCase {
  constructor(
    @Inject(RAPPROCHEMENT_REPOSITORY)
    private readonly repo: RapprochementRepository,
  ) {}

  async execute(ligneId: number, userId: number): Promise<MatchCandidate[]> {
    const ligne = await this.repo.findLigneReleveForUser(ligneId, userId);
    if (!ligne) throw new NotFoundException('Ligne de relevé introuvable.');

    const jlCandidates = await this.repo.findJournalLinesForMatching(
      userId,
      Math.abs(ligne.montant),
      ligne.date,
      TOLERANCE_JOURS,
      TOLERANCE_PCT,
    );

    return jlCandidates
      .map(jl => {
        const { score, reasons } = scoreCandidate(ligne, jl);
        return { journalLineId: jl.id, debit: jl.debit, credit: jl.credit, account: jl.account, entry: jl.entry, score, reasons };
      })
      .filter(c => c.score >= MIN_SCORE_RETURN)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }
}
