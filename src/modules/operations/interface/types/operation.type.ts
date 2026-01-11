export enum OperationType {
  /* =========================
     EXPLOITATION
     ========================= */
  PURCHASE = 'PURCHASE',                  // Achat
  SALE = 'SALE',                          // Vente
  SERVICE_EXPENSE = 'SERVICE_EXPENSE',    // Dépense de service
  SERVICE_INCOME = 'SERVICE_INCOME',      // Revenu de service

  /* =========================
     FINANCIÈRES
     ========================= */
  PAYMENT = 'PAYMENT',                    // Paiement simple
  RECEIPT = 'RECEIPT',                    // Encaissement
  TRANSFER = 'TRANSFER',                  // Transfert interne
  BANK_DEPOSIT = 'BANK_DEPOSIT',          // Dépôt bancaire
  BANK_WITHDRAWAL = 'BANK_WITHDRAWAL',    // Retrait bancaire

  /* =========================
     PRÊTS & DETTES
     ========================= */
  LOAN_GIVEN = 'LOAN_GIVEN',               // Prêt accordé
  LOAN_RECEIVED = 'LOAN_RECEIVED',         // Prêt reçu
  LOAN_REPAYMENT = 'LOAN_REPAYMENT',       // Remboursement de prêt
  DEBT_PAYMENT = 'DEBT_PAYMENT',           // Paiement de dette

  /* =========================
     DONS & SUBVENTIONS
     ========================= */
  DONATION_GIVEN = 'DONATION_GIVEN',       // Don donné
  DONATION_RECEIVED = 'DONATION_RECEIVED', // Don reçu
  SUBSIDY_RECEIVED = 'SUBSIDY_RECEIVED',   // Subvention reçue

  /* =========================
     INVESTISSEMENTS
     ========================= */
  ASSET_PURCHASE = 'ASSET_PURCHASE',       // Achat immobilisation
  ASSET_SALE = 'ASSET_SALE',               // Vente immobilisation
  DEPRECIATION = 'DEPRECIATION',           // Amortissement

  /* =========================
     SALAIRES & SOCIAL
     ========================= */
  SALARY_PAYMENT = 'SALARY_PAYMENT',       // Paiement salaire
  SOCIAL_CONTRIBUTION = 'SOCIAL_CONTRIBUTION', // Cotisations sociales

  /* =========================
     FISCALITÉ
     ========================= */
  TAX_PAYMENT = 'TAX_PAYMENT',             // Paiement d’impôt
  VAT_COLLECTED = 'VAT_COLLECTED',         // TVA collectée
  VAT_DEDUCTED = 'VAT_DEDUCTED',           // TVA déductible

  /* =========================
     EXCEPTIONNEL
     ========================= */
  FINE = 'FINE',                           // Amende
  LOSS = 'LOSS',                           // Perte exceptionnelle
  GAIN = 'GAIN',                           // Gain exceptionnel

  /* =========================
     CORRECTIONS
     ========================= */
  ADJUSTMENT = 'ADJUSTMENT',               // Ajustement comptable
  OPENING_BALANCE = 'OPENING_BALANCE',     // Solde d’ouverture
  CLOSING_BALANCE = 'CLOSING_BALANCE'      // Solde de clôture
}
 