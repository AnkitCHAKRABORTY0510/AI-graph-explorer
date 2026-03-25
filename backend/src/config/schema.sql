BEGIN;

-- ===============================
-- BILLING
-- ===============================

CREATE TABLE billing_document_headers (
    billing_document TEXT PRIMARY KEY,
    billing_document_type TEXT,
    creation_date TIMESTAMP,
    last_change_datetime TIMESTAMP,
    billing_document_date TIMESTAMP,
    is_cancelled BOOLEAN,
    total_net_amount NUMERIC,
    currency TEXT,
    company_code TEXT,
    fiscal_year TEXT,
    accounting_document TEXT,
    sold_to_party TEXT,
    raw JSONB
);

CREATE TABLE billing_document_items (
    billing_document TEXT,
    billing_document_item TEXT,
    material TEXT,
    billing_quantity NUMERIC,
    billing_quantity_unit TEXT,
    net_amount NUMERIC,
    currency TEXT,
    reference_sd_document TEXT,
    reference_sd_document_item TEXT,
    raw JSONB,
    PRIMARY KEY (billing_document, billing_document_item)
);

CREATE TABLE billing_document_cancellations (
    billing_document TEXT PRIMARY KEY,
    is_cancelled BOOLEAN,
    cancelled_billing_document TEXT,
    raw JSONB
);

-- ===============================
-- BUSINESS PARTNER
-- ===============================

CREATE TABLE business_partners (
    business_partner TEXT PRIMARY KEY,
    customer TEXT,
    full_name TEXT,
    category TEXT,
    created_by TEXT,
    creation_date TIMESTAMP,
    last_change_date TIMESTAMP,
    is_blocked BOOLEAN,
    raw JSONB
);

CREATE TABLE business_partner_addresses (
    business_partner TEXT,
    address_id TEXT,
    city TEXT,
    country TEXT,
    postal_code TEXT,
    region TEXT,
    street TEXT,
    raw JSONB,
    PRIMARY KEY (business_partner, address_id)
);

-- ===============================
-- CUSTOMER
-- ===============================

CREATE TABLE customer_company_assignments (
    customer TEXT,
    company_code TEXT,
    reconciliation_account TEXT,
    customer_account_group TEXT,
    raw JSONB,
    PRIMARY KEY (customer, company_code)
);

CREATE TABLE customer_sales_area_assignments (
    customer TEXT,
    sales_organization TEXT,
    distribution_channel TEXT,
    division TEXT,
    currency TEXT,
    payment_terms TEXT,
    raw JSONB,
    PRIMARY KEY (customer, sales_organization, distribution_channel, division)
);

-- ===============================
-- SALES
-- ===============================

CREATE TABLE sales_order_headers (
    sales_order TEXT PRIMARY KEY,
    sales_order_type TEXT,
    sales_organization TEXT,
    distribution_channel TEXT,
    division TEXT,
    sold_to_party TEXT,
    creation_date TIMESTAMP,
    total_net_amount NUMERIC,
    currency TEXT,
    raw JSONB
);

CREATE TABLE sales_order_items (
    sales_order TEXT,
    sales_order_item TEXT,
    material TEXT,
    requested_quantity NUMERIC,
    net_amount NUMERIC,
    plant TEXT,
    storage_location TEXT,
    raw JSONB,
    PRIMARY KEY (sales_order, sales_order_item)
);

CREATE TABLE sales_order_schedule_lines (
    sales_order TEXT,
    sales_order_item TEXT,
    schedule_line TEXT,
    confirmed_delivery_date TIMESTAMP,
    confirmed_quantity NUMERIC,
    raw JSONB,
    PRIMARY KEY (sales_order, sales_order_item, schedule_line)
);

-- ===============================
-- DELIVERY
-- ===============================

CREATE TABLE outbound_delivery_headers (
    delivery_document TEXT PRIMARY KEY,
    creation_date TIMESTAMP,
    shipping_point TEXT,
    goods_movement_status TEXT,
    raw JSONB
);

CREATE TABLE outbound_delivery_items (
    delivery_document TEXT,
    delivery_document_item TEXT,
    plant TEXT,
    storage_location TEXT,
    reference_sd_document TEXT,
    raw JSONB,
    PRIMARY KEY (delivery_document, delivery_document_item)
);

-- ===============================
-- FINANCE
-- ===============================

CREATE TABLE journal_entry_items_ar (
    company_code TEXT,
    fiscal_year TEXT,
    accounting_document TEXT,
    accounting_document_item TEXT,
    gl_account TEXT,
    customer TEXT,
    amount NUMERIC,
    currency TEXT,
    posting_date TIMESTAMP,
    raw JSONB,
    PRIMARY KEY (
        company_code,
        fiscal_year,
        accounting_document,
        accounting_document_item
    )
);

CREATE TABLE payments_ar (
    company_code TEXT,
    fiscal_year TEXT,
    accounting_document TEXT,
    accounting_document_item TEXT,
    customer TEXT,
    amount NUMERIC,
    currency TEXT,
    posting_date TIMESTAMP,
    raw JSONB,
    PRIMARY KEY (
        company_code,
        fiscal_year,
        accounting_document,
        accounting_document_item
    )
);

-- ===============================
-- PRODUCT
-- ===============================

CREATE TABLE products (
    product TEXT PRIMARY KEY,
    product_type TEXT,
    product_group TEXT,
    base_unit TEXT,
    gross_weight NUMERIC,
    net_weight NUMERIC,
    raw JSONB
);

CREATE TABLE product_descriptions (
    product TEXT,
    language TEXT,
    description TEXT,
    raw JSONB,
    PRIMARY KEY (product, language)
);

CREATE TABLE product_plants (
    product TEXT,
    plant TEXT,
    profit_center TEXT,
    raw JSONB,
    PRIMARY KEY (product, plant)
);

CREATE TABLE product_storage_locations (
    product TEXT,
    plant TEXT,
    storage_location TEXT,
    raw JSONB,
    PRIMARY KEY (product, plant, storage_location)
);

-- ===============================
-- PLANT
-- ===============================

CREATE TABLE plants (
    plant TEXT PRIMARY KEY,
    plant_name TEXT,
    company_code TEXT,
    sales_organization TEXT,
    raw JSONB
);



COMMIT;







