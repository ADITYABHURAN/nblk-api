const { app } = require('@azure/functions');
const sql = require('mssql');
const { EmailClient } = require('@azure/communication-email');
const dbConfig = require('../../dbConfig');

const ACS_CONNECTION_STRING = process.env.ACS_CONNECTION_STRING;
const SENDER_ADDRESS = process.env.SENDER_ADDRESS;

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

            // Insert into SQL
            const pool = await sql.connect(dbConfig);
            const result = await pool.request()
                .input('name', sql.NVarChar, name)
                .input('email', sql.NVarChar, email)
                .input('phone', sql.NVarChar, phone || null)
                .query('INSERT INTO Customers (Name, Email, Phone) VALUES (@name, @email, @phone); SELECT SCOPE_IDENTITY() AS CustomerID');
            await pool.close();

            const customerID = result.recordset[0].CustomerID;

            // Send welcome email
            try {
                const emailClient = new EmailClient(ACS_CONNECTION_STRING);
                const message = {
                    senderAddress: `DoNotReply@${SENDER_ADDRESS}`,
                    content: {
                        subject: 'Welcome to NBLK!',
                        plainText: `Hi ${name}, welcome! Your customer ID is ${customerID}.`,
                        html: `<h2>Welcome to NBLK, ${name}!</h2><p>Thank you for joining us. Your customer ID is <strong>${customerID}</strong>.</p><p>We look forward to working with you!</p>`
                    },
                    recipients: { to: [{ address: email }] }
                };
                const poller = await emailClient.beginSend(message);
                await poller.pollUntilDone();
                context.log('Welcome email sent to', email);
            } catch (emailErr) {
                context.log('Email error:', emailErr.message);
            }

            return {
                status: 201,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: 'Customer added!', customerID })
            };
        } catch (err) {
            context.log('Error:', err);
            return { status: 500, body: JSON.stringify({ error: err.message }) };
        }
    }
});