/**
 * ClickHouse Hot OLAP Sink
 * 
 * Ingests normalized UDM events into ClickHouse for sub-second analytical queries.
 * Handles batching, automatic schema creation, and efficient columnar storage.
 * 
 * Required secrets:
 * - CLICKHOUSE_HOST (e.g., "clickhouse.example.com")
 * - CLICKHOUSE_PORT (default: 8123)
 * - CLICKHOUSE_USER (default: "default")
 * - CLICKHOUSE_PASSWORD (optional)
 * - CLICKHOUSE_DATABASE (default: "udm_analytics")
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

class ClickHouseClient {
  constructor(host, port, user, password, database) {
    this.host = host;
    this.port = port;
    this.user = user;
    this.password = password;
    this.database = database;
    this.base_url = `http://${host}:${port}`;
  }

  async query(sql, params = []) {
    const query_string = params.length > 0 
      ? sql + '?' + new URLSearchParams(Object.entries(params)).toString()
      : sql;

    const response = await fetch(`${this.base_url}/?user=${this.user}${this.password ? `&password=${this.password}` : ''}&database=${this.database}`, {
      method: 'POST',
      body: sql,
    });

    if (!response.ok) {
      throw new Error(`ClickHouse error: ${response.statusText}`);
    }

    return response.text();
  }

  async createTableIfNotExists(table_name) {
    const create_table_sql = `
      CREATE TABLE IF NOT EXISTS ${this.database}.${table_name} (
        timestamp DateTime,
        event_id String,
        principal_userid String,
        principal_hostname String,
        target_hostname String,
        target_ip String,
        network_ip String,
        network_port UInt16,
        network_protocol String,
        security_action String,
        security_severity String,
        security_category String,
        event_data String
      ) ENGINE = MergeTree()
      ORDER BY (timestamp, event_id)
    `;

    return this.query(create_table_sql);
  }

  async insertBatch(table_name, events) {
    if (events.length === 0) return { inserted: 0 };

    // Flatten UDM events to columnar format
    const rows = events.map((e) => ({
      timestamp: e.timestamp || new Date().toISOString(),
      event_id: e.event_id || 'unknown',
      principal_userid: e.principal?.user?.userid || '',
      principal_hostname: e.principal?.host?.hostname || '',
      target_hostname: e.target?.asset?.hostname || '',
      target_ip: e.target?.asset?.ip || '',
      network_ip: e.network?.ip || '',
      network_port: e.network?.port || 0,
      network_protocol: e.network?.protocol || '',
      security_action: e.security_result?.action || '',
      security_severity: e.security_result?.severity || '',
      security_category: e.security_result?.category || '',
      event_data: JSON.stringify(e),
    }));

    // Build TabSeparated format (efficient for batch inserts)
    const tsv_data = rows
      .map((r) =>
        [
          r.timestamp,
          r.event_id,
          r.principal_userid,
          r.principal_hostname,
          r.target_hostname,
          r.target_ip,
          r.network_ip,
          r.network_port,
          r.network_protocol,
          r.security_action,
          r.security_severity,
          r.security_category,
          r.event_data,
        ].join('\t')
      )
      .join('\n');

    if (!/^[a-zA-Z0-9_]+$/.test(this.database)) {
      throw new Error('Invalid input');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(table_name)) {
      throw new Error('Invalid input');
    }
    const insert_sql = `INSERT INTO ${this.database}.${table_name} FORMAT TabSeparated`;

    const response = await fetch(`${this.base_url}/?user=${this.user}${this.password ? `&password=${this.password}` : ''}&database=${this.database}`, {
      method: 'POST',
      body: tsv_data,
      headers: {
        'X-ClickHouse-Query': insert_sql,
      },
    });

    if (!response.ok) {
      throw new Error(
        `ClickHouse insert failed: ${response.statusText}`
      );
    }

    return { inserted: rows.length };
  }

  async queryEvents(filter_sql = '') {
    if (!/^[a-zA-Z0-9_]+$/.test(this.database)) {
      throw new Error('Invalid input');
    }
    const query = `
      SELECT 
        timestamp, event_id, principal_userid, target_hostname, 
        security_action, security_severity, security_category
      FROM ${this.database}.udm_events
      ${filter_sql}
      ORDER BY timestamp DESC
      LIMIT 1000
    `;

    const result = await this.query(query);
    return result;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { udm_events, batch_mode = false } = await req.json();

    if (!udm_events || !Array.isArray(udm_events)) {
      return Response.json(
        { error: 'Missing or invalid udm_events array' },
        { status: 400 }
      );
    }

    // Read ClickHouse config from secrets
    const ch_host = Deno.env.get('CLICKHOUSE_HOST') || 'localhost';
    const ch_port = Deno.env.get('CLICKHOUSE_PORT') || '8123';
    const ch_user = Deno.env.get('CLICKHOUSE_USER') || 'default';
    const ch_password = Deno.env.get('CLICKHOUSE_PASSWORD');
    const ch_database = Deno.env.get('CLICKHOUSE_DATABASE') || 'udm_analytics';

    const client = new ClickHouseClient(
      ch_host,
      ch_port,
      ch_user,
      ch_password,
      ch_database
    );

    // Ensure table exists
    await client.createTableIfNotExists('udm_events');

    // Insert batch
    const result = await client.insertBatch('udm_events', udm_events);

    return Response.json({
      success: true,
      database: ch_database,
      table: 'udm_events',
      inserted: result.inserted,
      total_events: udm_events.length,
      batch_mode,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('ClickHouse sink error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});