import pool from '../db/connection.js';

async function applyIndexes() {
  const client = await pool.connect();
  console.log("🐘 Connecting to Supabase to apply scalability indexes...");
  
  const sql = `
    CREATE INDEX IF NOT EXISTS idx_billing_items_ref ON billing_document_items(reference_sd_document);
    CREATE INDEX IF NOT EXISTS idx_delivery_items_ref ON outbound_delivery_items(reference_sd_document);
    CREATE INDEX IF NOT EXISTS idx_sales_headers_cust ON sales_order_headers(sold_to_party);
    CREATE INDEX IF NOT EXISTS idx_billing_headers_cust ON billing_document_headers(sold_to_party);
    CREATE INDEX IF NOT EXISTS idx_journal_ar_cust ON journal_entry_items_ar(customer);
    CREATE INDEX IF NOT EXISTS idx_payments_ar_cust ON payments_ar(customer);
    CREATE INDEX IF NOT EXISTS idx_so_items_so ON sales_order_items(sales_order);
    CREATE INDEX IF NOT EXISTS idx_bd_items_bd ON billing_document_items(billing_document);
  `;

  try {
    await client.query(sql);
    console.log("✅ Scalability indexes applied successfully!");
  } catch (err) {
    console.error("❌ Index Application Error:", err.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

applyIndexes();
