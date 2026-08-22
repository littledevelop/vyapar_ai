// src/lib/ai.ts - VyaparAI PRO AI Engine
// In production, this will call Gemini 1.5 Vision

// npm install @google/generative-ai

/**
 * PRODUCTION CODE (Commented for Demo - No API Key needed for Judges)
 * 
 * import { GoogleGenerativeAI } from "@google/generative-ai";
 * const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
 * 
 * export async function extractBillFromImage(imageBase64: string) {
 *   const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
 *   
 *   const prompt = `
 *   Extract {shopName, date, amount, items} from this bill image 
 *   that may contain Gujarati/Hindi. 
 *   The bill may be handwritten Gujarati like "પટેલ કિરાણા".
 *   Return ONLY JSON in format: 
 *   {"shopName": string, "date": "YYYY-MM-DD", "totalAmount": number, "items": string[], "category": "Sales|Purchase|Kharch", "confidence": number}
 *   `;
 * 
 *   const result = await model.generateContent([
 *     prompt,
 *     { inlineData: { data: imageBase64, mimeType: "image/jpeg" } }
 *   ]);
 *   
 *   return JSON.parse(result.response.text());
 * }
 */

// DEMO MOCK for Hackathon (Works offline for Judges)
export const PATEL_BILL_MOCK = {
  shopName: "Patel Kirana & General Store Bayad",
  date: new Date().toISOString().slice(0,10),
  totalAmount: 1005,
  items: ["Chawal 5kg", "Tel 1L", "Khand 2kg", "Chai Patti 500g", "Biscuit"],
  category: "Sales" as const,
  confidence: 98
};

export function mockOCR() {
  return PATEL_BILL_MOCK;
}