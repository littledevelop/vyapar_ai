// VyaparAI PRO production AI integration example.
// This helper is intentionally commented because the demo uses the server route.
// npm install @google/generative-ai

/**
 * Production Gemini 1.5 Vision implementation:
 *
 * import { GoogleGenerativeAI } from "@google/generative-ai";
 * const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
 * const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
 * const prompt = 'Extract {shopName, date, amount, items} from this bill image that may contain Gujarati/Hindi. Return ONLY JSON';
 * const result = await model.generateContent([
 *   prompt,
 *   { inlineData: { data: imageBase64, mimeType: "image/jpeg" } },
 * ]);
 * return JSON.parse(result.response.text());
 */

export {};
