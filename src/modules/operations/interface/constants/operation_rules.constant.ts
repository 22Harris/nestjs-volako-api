import { AccountingRule } from '../types/accounting_rule.type';
import { OperationType } from '../types/operation.type';

export const OPERATION_RULES: Partial<Record<OperationType, AccountingRule>> = {
  /* =========================
     EXPLOITATION
     ========================= */
  [OperationType.SALE]: {
    debit: '512', // Banque ou Caisse
    credit: '707', // Vente de marchandises
  },

  [OperationType.PURCHASE]: {
    debit: '606', // Achats
    credit: '512', // Banque
  },

  [OperationType.SERVICE_EXPENSE]: {
    debit: '615', // Services extérieurs
    credit: '512',
  },

  [OperationType.SERVICE_INCOME]: {
    debit: '512',
    credit: '706', // Prestations de services
  },

  /* =========================
     FINANCIÈRES
     ========================= */
  [OperationType.PAYMENT]: {
    debit: '401', // Fournisseurs (ou dettes)
    credit: '512',
  },

  [OperationType.RECEIPT]: {
    debit: '512',
    credit: '411', // Clients (ou créances)
  },

  [OperationType.TRANSFER]: {
    debit: '512', // Compte bancaire cible
    credit: '512', // Compte bancaire source
  },

  [OperationType.BANK_DEPOSIT]: {
    debit: '512', // Banque
    credit: '531', // Caisse
  },

  [OperationType.BANK_WITHDRAWAL]: {
    debit: '531', // Caisse
    credit: '512', // Banque
  },

  /* =========================
     PRÊTS & DETTES
     ========================= */
  [OperationType.LOAN_GIVEN]: {
    debit: '273', // Prêts et avances à long terme
    credit: '512',
  },

  [OperationType.LOAN_RECEIVED]: {
    debit: '512',
    credit: '164', // Emprunts et dettes financières
  },

  [OperationType.LOAN_REPAYMENT]: {
    debit: '164', // Remboursement emprunt
    credit: '512',
  },

  [OperationType.DEBT_PAYMENT]: {
    debit: '401', // Fournisseurs
    credit: '512',
  },

  /* =========================
     DONS & SUBVENTIONS
     ========================= */
  [OperationType.DONATION_GIVEN]: {
    debit: '658', // Charges exceptionnelles sur opérations de gestion
    credit: '512',
  },

  [OperationType.DONATION_RECEIVED]: {
    debit: '512',
    credit: '758', // Produits exceptionnels
  },

  [OperationType.SUBSIDY_RECEIVED]: {
    debit: '512',
    credit: '74', // Subventions d'exploitation
  },

  /* =========================
     INVESTISSEMENTS
     ========================= */
  [OperationType.ASSET_PURCHASE]: {
    debit: '21', // Immobilisations corporelles
    credit: '512',
  },

  [OperationType.ASSET_SALE]: {
    debit: '512',
    credit: '775', // Produits de cession d'immobilisations
  },

  [OperationType.DEPRECIATION]: {
    debit: '6811', // Dotations aux amortissements
    credit: '28', // Amortissements des immobilisations
  },

  /* =========================
     SALAIRES & SOCIAL
     ========================= */
  [OperationType.SALARY_PAYMENT]: {
    debit: '641', // Charges de personnel
    credit: '512',
  },

  [OperationType.SOCIAL_CONTRIBUTION]: {
    debit: '645', // Charges sociales
    credit: '512',
  },

  /* =========================
     FISCALITÉ
     ========================= */
  [OperationType.TAX_PAYMENT]: {
    debit: '445', // État – impôts
    credit: '512',
  },

  [OperationType.VAT_COLLECTED]: {
    debit: '411', // Clients
    credit: '44571', // TVA collectée
  },

  [OperationType.VAT_DEDUCTED]: {
    debit: '44566', // TVA déductible
    credit: '401', // Fournisseurs
  },

  /* =========================
     EXCEPTIONNEL
     ========================= */
  [OperationType.FINE]: {
    debit: '671', // Charges exceptionnelles
    credit: '512',
  },

  [OperationType.LOSS]: {
    debit: '67', // Charges exceptionnelles
    credit: '512',
  },

  [OperationType.GAIN]: {
    debit: '512',
    credit: '77', // Produits exceptionnels
  },

  /* =========================
     CORRECTIONS
     ========================= */
  [OperationType.ADJUSTMENT]: {
    debit: '512', // Selon le type d'ajustement
    credit: '512',
  },

  [OperationType.OPENING_BALANCE]: {
    debit: '101', // Capital ou report à nouveau
    credit: '512',
  },

  [OperationType.CLOSING_BALANCE]: {
    debit: '512',
    credit: '101',
  },
};
