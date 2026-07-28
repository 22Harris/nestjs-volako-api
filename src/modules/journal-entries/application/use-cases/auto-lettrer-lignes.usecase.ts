import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { JOURNAL_ENTRIES } from '../ports/journal-entries.token';
import type { JournalEntryRepository, LineForLettrage } from '../ports/journal-entries.repository.interface';

const MAX_GROUP = 6;

@Injectable()
export class AutoLettrerLignesUseCase {
  constructor(
    @Inject(JOURNAL_ENTRIES)
    private readonly repo: JournalEntryRepository,
  ) {}

  async execute(
    accountId: number,
    userId: number,
  ): Promise<{ groupes: number; lignes: number }> {
    const unlettered = await this.repo.getUnletteredLines(accountId, userId);

    if (unlettered.length === 0) {
      throw new NotFoundException('Aucune ligne non lettrée pour ce compte');
    }

    const groups = findBalancedGroups(unlettered);

    if (groups.length === 0) {
      throw new BadRequestException('Aucun groupe équilibré trouvé automatiquement');
    }

    let totalLines = 0;
    for (const group of groups) {
      const ids = group.map(l => l.id);
      await this.repo.lettrerLignes(ids, userId);
      totalLines += ids.length;
    }

    return { groupes: groups.length, lignes: totalLines };
  }
}

function findBalancedGroups(lines: LineForLettrage[]): LineForLettrage[][] {
  const used = new Set<number>();
  const groups: LineForLettrage[][] = [];

  // 1:1 matching — most common and fastest
  const byNet = new Map<number, LineForLettrage[]>();
  for (const l of lines) {
    const net = l.debit - l.credit;
    if (net === 0) continue; // zero-net lines are already balanced on their own but not useful
    if (!byNet.has(net)) byNet.set(net, []);
    byNet.get(net)!.push(l);
  }

  for (const [net, pos] of byNet) {
    const neg = byNet.get(-net);
    if (!neg) continue;
    for (const a of pos) {
      if (used.has(a.id)) continue;
      for (const b of neg) {
        if (used.has(b.id)) continue;
        groups.push([a, b]);
        used.add(a.id);
        used.add(b.id);
        break;
      }
    }
  }

  // Multi-line matching for remaining lines (up to MAX_GROUP)
  const remaining = lines.filter(l => !used.has(l.id) && l.debit - l.credit !== 0);
  if (remaining.length >= 2) {
    const multiGroups = findMultiLineGroups(remaining, MAX_GROUP);
    for (const g of multiGroups) {
      if (g.some(l => used.has(l.id))) continue;
      groups.push(g);
      for (const l of g) used.add(l.id);
    }
  }

  return groups;
}

function findMultiLineGroups(lines: LineForLettrage[], maxSize: number): LineForLettrage[][] {
  const groups: LineForLettrage[][] = [];
  const used = new Set<number>();

  function backtrack(start: number, current: LineForLettrage[], netSum: number): void {
    if (current.length >= 2 && netSum === 0) {
      groups.push([...current]);
      for (const l of current) used.add(l.id);
      return;
    }
    if (current.length >= maxSize) return;

    for (let i = start; i < lines.length; i++) {
      const l = lines[i];
      if (used.has(l.id)) continue;
      current.push(l);
      backtrack(i + 1, current, netSum + l.debit - l.credit);
      current.pop();
      // Once we found a group starting with current[0], stop exploring this branch
      if (current.length === 0 && groups.length > 0 && groups[groups.length - 1].includes(l)) break;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    if (used.has(lines[i].id)) continue;
    backtrack(i, [], 0);
  }

  return groups;
}
