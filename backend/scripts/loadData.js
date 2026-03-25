import fs from "fs";
import path from "path";
import readline from "readline";
import pool from "../db/connection.js";

const BASE = path.join(process.cwd(), "data");
const BATCH_SIZE = 200;

// =========================
// HELPERS
// =========================
const toTimestamp = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

const toNum = (v) => (v === "" || v == null ? null : Number(v));
const toBool = (v) => (v === "" || v == null ? null : Boolean(v));
const safe = (v) => (v === "" || v === undefined ? null : v);

// =========================
// STREAM JSONL
// =========================
async function processFile(filePath, handler, client) {
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  });

  let batch = [];
  let count = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;

    try {
      const json = JSON.parse(line);
      batch.push(json);
      count++;

      if (batch.length >= BATCH_SIZE) {
        for (const r of batch) await handler(client, r);
        batch = [];
      }
    } catch (e) {
      console.error("❌ JSON error:", e.message);
    }
  }

  for (const r of batch) await handler(client, r);

  return count;
}

// =========================
// HANDLERS (ALL 19 TABLES)
// =========================

// 1
const billing_document_headers = async (c, r) => {
  await c.query(`
    INSERT INTO billing_document_headers VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13
    ) ON CONFLICT DO NOTHING
  `, [
    r.billingDocument,
    r.billingDocumentType,
    toTimestamp(r.creationDate),
    toTimestamp(r.lastChangeDateTime),
    toTimestamp(r.billingDocumentDate),
    toBool(r.billingDocumentIsCancelled),
    toNum(r.totalNetAmount),
    r.transactionCurrency,
    r.companyCode,
    r.fiscalYear,
    r.accountingDocument,
    r.soldToParty,
    r
  ]);
};

// 2
const billing_document_items = async (c, r) => {
  await c.query(`
    INSERT INTO billing_document_items VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
    ) ON CONFLICT DO NOTHING
  `, [
    r.billingDocument,
    r.billingDocumentItem,
    r.material,
    toNum(r.billingQuantity),
    r.billingQuantityUnit,
    toNum(r.netAmount),
    r.transactionCurrency,
    r.referenceSdDocument,
    r.referenceSdDocumentItem,
    r
  ]);
};

// 3
const billing_document_cancellations = async (c, r) => {
  await c.query(`
    INSERT INTO billing_document_cancellations VALUES ($1,$2,$3,$4)
    ON CONFLICT DO NOTHING
  `, [
    r.billingDocument,
    r.billingDocumentIsCancelled,
    r.cancelledBillingDocument,
    r
  ]);
};

// 4
const business_partners = async (c, r) => {
  await c.query(`
    INSERT INTO business_partners VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    ON CONFLICT DO NOTHING
  `, [
    r.businessPartner,
    r.customer,
    r.businessPartnerFullName,
    r.businessPartnerCategory,
    r.createdByUser,
    toTimestamp(r.creationDate),
    toTimestamp(r.lastChangeDate),
    toBool(r.businessPartnerIsBlocked),
    r
  ]);
};

// 5
const business_partner_addresses = async (c, r) => {
  await c.query(`
    INSERT INTO business_partner_addresses VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    ON CONFLICT DO NOTHING
  `, [
    r.businessPartner,
    r.addressId,
    r.cityName,
    r.country,
    r.postalCode,
    r.region,
    r.streetName,
    r
  ]);
};

// 6
const customer_company_assignments = async (c, r) => {
  await c.query(`
    INSERT INTO customer_company_assignments VALUES ($1,$2,$3,$4,$5)
    ON CONFLICT DO NOTHING
  `, [
    r.customer,
    r.companyCode,
    r.reconciliationAccount,
    r.customerAccountGroup,
    r
  ]);
};

// 7
const customer_sales_area_assignments = async (c, r) => {
  await c.query(`
    INSERT INTO customer_sales_area_assignments VALUES ($1,$2,$3,$4,$5,$6,$7)
    ON CONFLICT DO NOTHING
  `, [
    r.customer,
    r.salesOrganization,
    r.distributionChannel,
    r.division,
    r.currency,
    r.customerPaymentTerms,
    r
  ]);
};

// 8
const sales_order_headers = async (c, r) => {
  await c.query(`
    INSERT INTO sales_order_headers VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
    ) ON CONFLICT DO NOTHING
  `, [
    r.salesOrder,
    r.salesOrderType,
    r.salesOrganization,
    r.distributionChannel,
    r.organizationDivision,
    r.soldToParty,
    toTimestamp(r.creationDate),
    toNum(r.totalNetAmount),
    r.transactionCurrency,
    r
  ]);
};

// 9
const sales_order_items = async (c, r) => {
  await c.query(`
    INSERT INTO sales_order_items VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8
    ) ON CONFLICT DO NOTHING
  `, [
    r.salesOrder,
    r.salesOrderItem,
    r.material,
    toNum(r.requestedQuantity),
    toNum(r.netAmount),
    r.productionPlant,
    r.storageLocation,
    r
  ]);
};

// 10
const sales_order_schedule_lines = async (c, r) => {
  await c.query(`
    INSERT INTO sales_order_schedule_lines VALUES ($1,$2,$3,$4,$5,$6)
    ON CONFLICT DO NOTHING
  `, [
    r.salesOrder,
    r.salesOrderItem,
    r.scheduleLine,
    toTimestamp(r.confirmedDeliveryDate),
    toNum(r.confdOrderQtyByMatlAvailCheck),
    r
  ]);
};

// 11
const outbound_delivery_headers = async (c, r) => {
  await c.query(`
    INSERT INTO outbound_delivery_headers VALUES ($1,$2,$3,$4,$5)
    ON CONFLICT DO NOTHING
  `, [
    r.deliveryDocument,
    toTimestamp(r.creationDate),
    r.shippingPoint,
    r.overallGoodsMovementStatus,
    r
  ]);
};

// 12
const outbound_delivery_items = async (c, r) => {
  await c.query(`
    INSERT INTO outbound_delivery_items VALUES ($1,$2,$3,$4,$5,$6)
    ON CONFLICT DO NOTHING
  `, [
    r.deliveryDocument,
    r.deliveryDocumentItem,
    r.plant,
    r.storageLocation,
    r.referenceSdDocument,
    r
  ]);
};

// 13
const journal_entry_items_accounts_receivable = async (c, r) => {
  await c.query(`
    INSERT INTO journal_entry_items_ar VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
    ) ON CONFLICT DO NOTHING
  `, [
    r.companyCode,
    r.fiscalYear,
    r.accountingDocument,
    r.accountingDocumentItem,
    r.glAccount,
    r.customer,
    toNum(r.amountInTransactionCurrency),
    r.transactionCurrency,
    toTimestamp(r.postingDate),
    r
  ]);
};

// 14
const payments_accounts_receivable = async (c, r) => {
  await c.query(`
    INSERT INTO payments_ar VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9
    ) ON CONFLICT DO NOTHING
  `, [
    r.companyCode,
    r.fiscalYear,
    r.accountingDocument,
    r.accountingDocumentItem,
    r.customer,
    toNum(r.amountInTransactionCurrency),
    r.transactionCurrency,
    toTimestamp(r.postingDate),
    r
  ]);
};

// 15
const plants = async (c, r) => {
  await c.query(`
    INSERT INTO plants VALUES ($1,$2,$3,$4,$5)
    ON CONFLICT DO NOTHING
  `, [
    r.plant,
    r.plantName,
    r.valuationArea,
    r.salesOrganization,
    r
  ]);
};

// 16
const product_descriptions = async (c, r) => {
  await c.query(`
    INSERT INTO product_descriptions VALUES ($1,$2,$3,$4)
    ON CONFLICT DO NOTHING
  `, [
    r.product,
    r.language,
    r.productDescription,
    r
  ]);
};

// 17
const product_plants = async (c, r) => {
  await c.query(`
    INSERT INTO product_plants VALUES ($1,$2,$3,$4)
    ON CONFLICT DO NOTHING
  `, [
    r.product,
    r.plant,
    r.profitCenter,
    r
  ]);
};

// 18
const product_storage_locations = async (c, r) => {
  await c.query(`
    INSERT INTO product_storage_locations VALUES ($1,$2,$3,$4)
    ON CONFLICT DO NOTHING
  `, [
    r.product,
    r.plant,
    r.storageLocation,
    r
  ]);
};

// 19
const products = async (c, r) => {
  await c.query(`
    INSERT INTO products VALUES ($1,$2,$3,$4,$5,$6,$7)
    ON CONFLICT DO NOTHING
  `, [
    r.product,
    r.productType,
    r.productGroup,
    r.baseUnit,
    toNum(r.grossWeight),
    toNum(r.netWeight),
    r
  ]);
};

// =========================
// HANDLER MAP
// =========================
const handlers = {
  billing_document_headers,
  billing_document_items,
  billing_document_cancellations,
  business_partners,
  business_partner_addresses,
  customer_company_assignments,
  customer_sales_area_assignments,
  sales_order_headers,
  sales_order_items,
  sales_order_schedule_lines,
  outbound_delivery_headers,
  outbound_delivery_items,
  journal_entry_items_accounts_receivable,
  payments_accounts_receivable,
  plants,
  product_descriptions,
  product_plants,
  product_storage_locations,
  products
};

// =========================
// MAIN
// =========================
const run = async () => {
  console.log("🚀 LOADING ALL DATA\n");

  for (const folder of fs.readdirSync(BASE)) {
    if (!handlers[folder]) continue;

    console.log(`📂 ${folder}`);
    const dir = path.join(BASE, folder);

    const files = fs.readdirSync(dir).filter(f => f.endsWith(".jsonl"));

    for (const file of files) {
      const client = await pool.connect();

      try {
        await client.query("BEGIN");

        const count = await processFile(
          path.join(dir, file),
          handlers[folder],
          client
        );

        await client.query("COMMIT");
        console.log(`✅ ${file} (${count} rows)`);

      } catch (e) {
        await client.query("ROLLBACK");
        console.error(`❌ ${file}`, e.message);
      } finally {
        client.release();
      }
    }
  }

  console.log("\n🎉 ALL 19 DATASETS LOADED");
};

run();