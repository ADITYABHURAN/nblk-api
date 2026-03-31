const { app } = require('@azure/functions');
const sql = require('mssql');
const dbConfig = require('../../dbConfig');

app.http('DeleteCustomer', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const id = request.query.get('id');

            if (!id) {
                return { status: 400, body: JSON.stringify({ error: 'Customer ID is required' }) };
            }

            const pool = await sql.connect(dbConfig);
            const result = await pool.request()
                .input('id', sql.Int, parseInt(id))
                .query('DELETE FROM Customers WHERE CustomerID = @id');

            await pool.close();

            if (result.rowsAffected[0] === 0) {
                return { status: 404, body: JSON.stringify({ error: 'Customer not found' }) };
            }

            return {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: 'Customer deleted successfully' })
            };
        } catch (err) {
            context.log('Error:', err);
            return { status: 500, body: JSON.stringify({ error: err.message }) };
        }
    }
});
