const { app } = require('@azure/functions');
const sql = require('mssql');
const dbConfig = require('../../dbConfig');

app.http('AddCustomer', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const body = await request.json();
            const { name, email, phone } = body;

            if (!name || !email) {
                return { status: 400, body: JSON.stringify({ error: 'Name and email are required' }) };
            }

            const pool = await sql.connect(dbConfig);
            const result = await pool.request()
                .input('name', sql.NVarChar, name)
                .input('email', sql.NVarChar, email)
                .input('phone', sql.NVarChar, phone || null)
                .query('INSERT INTO Customers (Name, Email, Phone) VALUES (@name, @email, @phone); SELECT SCOPE_IDENTITY() AS CustomerID');

            await pool.close();

            return {
                status: 201,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: 'Customer added!', customerID: result.recordset[0].CustomerID })
            };
        } catch (err) {
            context.log('Error:', err);
            return { status: 500, body: JSON.stringify({ error: err.message }) };
        }
    }
});