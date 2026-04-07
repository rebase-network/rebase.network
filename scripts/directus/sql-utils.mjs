export function sqlString(value) {
  if (value === null || value === undefined) {
    return 'null';
  }

  return `'${String(value).replaceAll("'", "''")}'`;
}

export function sqlJson(value) {
  if (value === null || value === undefined) {
    return 'null';
  }

  return `${sqlString(JSON.stringify(value))}::jsonb`;
}

export function sqlJsonText(value) {
  if (value === null || value === undefined) {
    return 'null';
  }

  return `${sqlString(JSON.stringify(value))}::json`;
}

export function sqlIdentifier(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function renderInsert({ table, columns, rows, onConflict }) {
  const columnList = columns.map(sqlIdentifier).join(', ');
  const values = rows
    .map((row) => `  (${columns.map((column) => row[column]).join(', ')})`)
    .join(',\n');

  return `insert into ${table} (${columnList})\nvalues\n${values}\n${onConflict};`;
}
