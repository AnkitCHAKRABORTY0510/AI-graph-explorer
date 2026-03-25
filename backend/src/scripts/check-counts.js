import pool from '../config/db.js';

const tables = [
  'billing_document_headers', 'billing_document_items', 'billing_document_cancellations',
  'business_partners', 'business_partner_addresses', 'customer_company_assignments',
  'customer_sales_area_assignments', 'journal_entry_items_ar', 'outbound_delivery_headers',
  'outbound_delivery_items', 'payments_ar', 'plants', 'product_descriptions',
  'product_plants', 'product_storage_locations', 'products', 'sales_order_headers',
  'sales_order_items', 'sales_order_schedule_lines'
];

async function checkCounts() {
  console.log("📊 Checking Row Counts in Supabase...");
  for (const table of tables) {
    try {
      const res = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`- ${table}: ${res.rows[0].count} rows`);
    } catch (err) {
      console.error(`- ${table}: ❌ ${err.message}`);
    }
  }
  process.exit(0);
}

checkCounts();
