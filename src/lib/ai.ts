export const MOCK_BILL = {
	shopName: "Patel Kirana & General Store Bayad",
	date: "2026-08-22",
	totalAmount: 1005,
	items: [
		"Chawal 5kg - Rs500",
		"Tel 1L - Rs180",
		"Khand 2kg - Rs90",
		"Chai Patti 500g - Rs160",
		"Biscuit - Rs75",
	],
	category: "Sales" as const,
	confidence: 98,
};

export function mockOCR() {
	return MOCK_BILL;
}

// VyaparAI PRO production AI integration example.
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

