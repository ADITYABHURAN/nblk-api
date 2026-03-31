const { app } = require('@azure/functions');
const sql = require('mssql');
const dbConfig = require('../../dbConfig');

app.http('GetCustomers', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const pool = await sql.connect(dbConfig);
            const result = await pool.request()
                .query('SELECT * FROM Customers ORDER BY CreatedAt DESC');

            await pool.close();

            return {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(result.recordset)
            };
        } catch (err) {
            context.log('Error:', err);
            return { status: 500, body: JSON.stringify({ error: err.message }) };
        }
    }
});