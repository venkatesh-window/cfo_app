import { createClient } from '@libsql/client';

const client = createClient({
    url: 'file:local.db',
});

// A simple sql tagged template function that mimics Neon's sql`` behavior
// Built for easy transitioning back and forth.
const sql = async (strings: TemplateStringsArray, ...values: any[]) => {
    let query = '';
    let args: any[] = [];

    for (let i = 0; i < strings.length; i++) {
        query += strings[i];
        if (i < values.length) {
            query += '?';
            args.push(values[i]);
        }
    }

    const result = await client.execute({ sql: query, args });

    return result.rows.map(row => {
        // Transform libsql row array/object format to normal object format 
        // to keep compatibility with Neon's output format.
        const mappedRow: Record<string, any> = {};
        for (const column of result.columns) {
            mappedRow[column] = row[column];
        }
        return mappedRow;
    });
};

export default sql;
