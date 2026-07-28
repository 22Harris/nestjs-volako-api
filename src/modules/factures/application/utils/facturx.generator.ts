import { CompanyInfo } from 'src/modules/company-info/domain/entities/company-info.entity';
import { Facture } from '../../domain/entities/facture.entity';

export type FacturXProfile = 'MINIMUM' | 'BASIC_WL' | 'EN_16931';

export interface FacturXOptions {
  profile?: FacturXProfile;
  tauxTva?: number; // 0-100, défaut 20
}

function fmt(cents: number): string {
  return (cents / 100).toFixed(2);
}

function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function profileUrn(profile: FacturXProfile): string {
  switch (profile) {
    case 'MINIMUM':    return 'urn:factur-x.eu:1p0:minimum';
    case 'BASIC_WL':   return 'urn:factur-x.eu:1p0:basicwl';
    case 'EN_16931':   return 'urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:en16931';
  }
}

export function generateFacturXXml(
  facture: Facture,
  seller: CompanyInfo,
  options: FacturXOptions = {},
): string {
  const profile = options.profile ?? 'MINIMUM';
  const tauxTva = options.tauxTva ?? 20;
  const tauxDecimal = tauxTva / 100;

  // Calcul des montants
  const montantTtc = facture.montant;
  const montantHt = Math.round(montantTtc / (1 + tauxDecimal));
  const montantTva = montantTtc - montantHt;
  const dueAmount = facture.resteAPayer ?? montantTtc;

  const dueDate = facture.dateEcheance ? fmtDate(facture.dateEcheance) : fmtDate(facture.date);
  const buyerName = esc(facture.tiersNom ?? 'Client');
  const sellerName = esc(seller.nom);
  const invoiceDate = fmtDate(facture.date);
  const invoiceId = esc(facture.numero);

  const lines: string[] = [];

  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  lines.push(`<rsm:CrossIndustryInvoice`);
  lines.push(`  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"`);
  lines.push(`  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"`);
  lines.push(`  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">`);

  // Context
  lines.push(`  <rsm:ExchangedDocumentContext>`);
  lines.push(`    <ram:GuidelineSpecifiedDocumentContextParameter>`);
  lines.push(`      <ram:ID>${profileUrn(profile)}</ram:ID>`);
  lines.push(`    </ram:GuidelineSpecifiedDocumentContextParameter>`);
  lines.push(`  </rsm:ExchangedDocumentContext>`);

  // Document header
  lines.push(`  <rsm:ExchangedDocument>`);
  lines.push(`    <ram:ID>${invoiceId}</ram:ID>`);
  lines.push(`    <ram:TypeCode>380</ram:TypeCode>`); // 380 = Facture commerciale
  lines.push(`    <ram:IssueDateTime>`);
  lines.push(`      <udt:DateTimeString format="102">${invoiceDate}</udt:DateTimeString>`);
  lines.push(`    </ram:IssueDateTime>`);
  if (facture.notes) {
    lines.push(`    <ram:IncludedNote>`);
    lines.push(`      <ram:Content>${esc(facture.notes)}</ram:Content>`);
    lines.push(`    </ram:IncludedNote>`);
  }
  lines.push(`  </rsm:ExchangedDocument>`);

  // Supply chain transaction
  lines.push(`  <rsm:SupplyChainTradeTransaction>`);

  // --- Trade agreement (seller + buyer) ---
  lines.push(`    <ram:ApplicableHeaderTradeAgreement>`);

  // Seller
  lines.push(`      <ram:SellerTradeParty>`);
  lines.push(`        <ram:Name>${sellerName}</ram:Name>`);
  if (seller.siret) {
    lines.push(`        <ram:SpecifiedLegalOrganization>`);
    lines.push(`          <ram:ID schemeID="0002">${esc(seller.siret)}</ram:ID>`);
    lines.push(`        </ram:SpecifiedLegalOrganization>`);
  }
  if (seller.adresse) {
    lines.push(`        <ram:PostalTradeAddress>`);
    lines.push(`          <ram:LineOne>${esc(seller.adresse)}</ram:LineOne>`);
    lines.push(`          <ram:CountryID>FR</ram:CountryID>`);
    lines.push(`        </ram:PostalTradeAddress>`);
  }
  if (seller.email) {
    lines.push(`        <ram:URIUniversalCommunication>`);
    lines.push(`          <ram:URIID schemeID="EM">${esc(seller.email)}</ram:URIID>`);
    lines.push(`        </ram:URIUniversalCommunication>`);
  }
  if (seller.numTva) {
    lines.push(`        <ram:SpecifiedTaxRegistration>`);
    lines.push(`          <ram:ID schemeID="VA">${esc(seller.numTva)}</ram:ID>`);
    lines.push(`        </ram:SpecifiedTaxRegistration>`);
  }
  lines.push(`      </ram:SellerTradeParty>`);

  // Buyer
  lines.push(`      <ram:BuyerTradeParty>`);
  lines.push(`        <ram:Name>${buyerName}</ram:Name>`);
  lines.push(`      </ram:BuyerTradeParty>`);

  lines.push(`    </ram:ApplicableHeaderTradeAgreement>`);

  // --- Delivery (required, empty for services) ---
  lines.push(`    <ram:ApplicableHeaderTradeDelivery/>`);

  // --- Settlement (totals + payment) ---
  lines.push(`    <ram:ApplicableHeaderTradeSettlement>`);
  lines.push(`      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>`);

  if (tauxTva > 0) {
    lines.push(`      <ram:ApplicableTradeTax>`);
    lines.push(`        <ram:CalculatedAmount>${fmt(montantTva)}</ram:CalculatedAmount>`);
    lines.push(`        <ram:TypeCode>VAT</ram:TypeCode>`);
    lines.push(`        <ram:BasisAmount>${fmt(montantHt)}</ram:BasisAmount>`);
    lines.push(`        <ram:CategoryCode>S</ram:CategoryCode>`);
    lines.push(`        <ram:RateApplicablePercent>${tauxTva.toFixed(2)}</ram:RateApplicablePercent>`);
    lines.push(`      </ram:ApplicableTradeTax>`);
  }

  if (facture.dateEcheance) {
    lines.push(`      <ram:SpecifiedTradePaymentTerms>`);
    lines.push(`        <ram:DueDateDateTime>`);
    lines.push(`          <udt:DateTimeString format="102">${dueDate}</udt:DateTimeString>`);
    lines.push(`        </ram:DueDateDateTime>`);
    lines.push(`      </ram:SpecifiedTradePaymentTerms>`);
  }

  if (seller.iban) {
    lines.push(`      <ram:SpecifiedTradeSettlementPaymentMeans>`);
    lines.push(`        <ram:TypeCode>58</ram:TypeCode>`); // 58 = SEPA Credit Transfer
    lines.push(`        <ram:PayeePartyCreditorFinancialAccount>`);
    lines.push(`          <ram:IBANID>${esc(seller.iban.replace(/\s/g, ''))}</ram:IBANID>`);
    lines.push(`        </ram:PayeePartyCreditorFinancialAccount>`);
    lines.push(`      </ram:SpecifiedTradeSettlementPaymentMeans>`);
  }

  lines.push(`      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>`);
  lines.push(`        <ram:LineTotalAmount>${fmt(montantHt)}</ram:LineTotalAmount>`);
  lines.push(`        <ram:TaxBasisTotalAmount>${fmt(montantHt)}</ram:TaxBasisTotalAmount>`);
  lines.push(`        <ram:TaxTotalAmount currencyID="EUR">${fmt(montantTva)}</ram:TaxTotalAmount>`);
  lines.push(`        <ram:GrandTotalAmount>${fmt(montantTtc)}</ram:GrandTotalAmount>`);
  lines.push(`        <ram:DuePayableAmount>${fmt(dueAmount)}</ram:DuePayableAmount>`);
  lines.push(`      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>`);

  lines.push(`    </ram:ApplicableHeaderTradeSettlement>`);
  lines.push(`  </rsm:SupplyChainTradeTransaction>`);
  lines.push(`</rsm:CrossIndustryInvoice>`);

  return lines.join('\n');
}
