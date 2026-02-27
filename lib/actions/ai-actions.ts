'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { getSession } from '../auth'
import { Transaction } from './transaction-actions'

const apiKey = process.env.GEMINI_API_KEY || ''
const genAI = new GoogleGenerativeAI(apiKey)

export async function parseTransactionAction(text: string) {
    const user = await getSession()
    if (!user) throw new Error('Unauthorized')

    if (!apiKey) {
        throw new Error('Gemini API key is not configured.')
    }

    const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
            temperature: 0,
        }
    })

    // We want to return { description, amount, type, category, date }
    const prompt = `You are a helpful financial assistant parsing a user's transaction.
Parse the following message into a JSON object.
Message: "${text}"

The JSON object must have the following keys exactly:
- "description": A clean, concise description of the transaction (without amounts).
- "amount": A number representing the numerical amount (absolute value, no currency symbols).
- "type": A string, either "income" or "expense".
- "category": Choose one of the following exact strings: Sales, Services, Rent, Utilities, Payroll, Marketing, Supplies, Travel, Meals, Software, Equipment, Taxes, Loans, Insurance, Other.
- "date": The transaction date in "YYYY-MM-DD" format. If not mentioned, use today's date (${new Date().toISOString().split('T')[0]}).

Return ONLY the raw JSON object, without markdown formatting or code blocks:`;

    const result = await model.generateContent(prompt)
    const responseText = result.response.text().trim().replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();

    try {
        const parsed = JSON.parse(responseText)
        return { success: true, parsed }
    } catch (err) {
        console.error("Failed to parse Gemini response", responseText)
        return { success: false, error: 'Failed to understand the transaction details.' }
    }
}

export async function generateInsightsAction(transactions: Transaction[]) {
    const user = await getSession()
    if (!user) throw new Error('Unauthorized')

    if (!apiKey) {
        return { success: false, error: 'Gemini API key is not configured.' }
    }

    const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
            temperature: 0.7,
        }
    })

    const txData = transactions.slice(0, 100).map(t => `${t.date}: [${t.type}] ${t.category} - $${t.amount} (${t.description})`).join('\n')

    const prompt = `You are an expert Chief Financial Officer (CFO). 
Analyze the following recent transactions for a business and provide 3-4 concise, highly actionable bullet points of financial insights or advice. Focus on cash flow health, category spikes, and potential savings.
Keep the tone professional but encouraging. Do not use markdown headers, just return exactly what should be displayed, formatted as markdown bullet points.

Transactions:
${txData || "No transactions yet."}

Insights:`

    try {
        const result = await model.generateContent(prompt)
        const responseText = result.response.text().trim()
        return { success: true, insights: responseText }
    } catch (err) {
        console.error("Failed to generate insights", err)
        return { success: false, error: 'Failed to generate insights.' }
    }
}
