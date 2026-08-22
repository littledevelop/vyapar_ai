import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024;

type Category =
  | "Sales"
  | "Purchase"
  | "Kharch";

type ExtractedBill = {
  shopName: string;
  date: string;
  totalAmount: number;
  items: string[];
  category: Category;
  confidence: number;
};

function isCategory(
  value: unknown
): value is Category {
  return (
    value === "Sales" ||
    value === "Purchase" ||
    value === "Kharch"
  );
}

function normalizeDate(
  value: unknown
): string {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return new Date()
      .toISOString()
      .slice(0, 10);
  }

  const match =
    value.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (match) {
    return value;
  }

  return new Date()
    .toISOString()
    .slice(0, 10);
}

function normalizeBill(
  value: unknown
): ExtractedBill {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    throw new Error(
      "Invalid AI response"
    );
  }

  const obj =
    value as Record<
      string,
      unknown
    >;

  const shopName =
    typeof obj.shopName ===
    "string"
      ? obj.shopName.trim()
      : "";

  const totalAmount =
    typeof obj.totalAmount ===
    "number"
      ? obj.totalAmount
      : Number(
          obj.totalAmount
        );

  const items = Array.isArray(
    obj.items
  )
    ? obj.items.filter(
        (
          item
        ): item is string =>
          typeof item ===
          "string"
      )
    : [];

  const category =
    isCategory(
      obj.category
    )
      ? obj.category
      : "Purchase";

  const confidence =
    typeof obj.confidence ===
    "number"
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(
              obj.confidence
            )
          )
        )
      : 90;

  if (!shopName) {
    throw new Error(
      "Shop name could not be extracted"
    );
  }

  if (
    !Number.isFinite(
      totalAmount
    ) ||
    totalAmount < 0
  ) {
    throw new Error(
      "Invalid total amount returned by AI"
    );
  }

  return {
    shopName,
    date: normalizeDate(
      obj.date
    ),
    totalAmount,
    items,
    category,
    confidence,
  };
}

async function fileToDataUrl(
  file: File
): Promise<string> {
  const buffer =
    Buffer.from(
      await file.arrayBuffer()
    );

  return `data:${file.type};base64,${buffer.toString(
    "base64"
  )}`;
}

export async function POST(
  request: Request
) {
  try {
    if (
      !process.env
        .OPENAI_API_KEY
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "OPENAI_API_KEY is not configured.",
        },
        { status: 500 }
      );
    }

    const formData =
      await request.formData();

    const file =
      formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No bill file was uploaded.",
        },
        { status: 400 }
      );
    }

    if (
      !ALLOWED_TYPES.has(
        file.type
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only JPG, PNG, WEBP or PDF files are supported.",
        },
        { status: 400 }
      );
    }

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "File is too large. Maximum size is 10 MB.",
        },
        { status: 400 }
      );
    }

    const dataUrl =
      await fileToDataUrl(
        file
      );

    const isPdf =
      file.type ===
      "application/pdf";

    const response =
      await openai.responses.create(
        {
          model: "gpt-5.6-luna",

          instructions: `
You are VyaparAI PRO, an expert Indian business bill/invoice parser.

Analyze the uploaded bill carefully.

Extract:
1. Shop or business name
2. Bill date
3. Final payable total amount
4. Important line items
5. Category
6. Confidence score

Category rules:
- Sales: a bill/invoice showing goods or services sold to a customer.
- Purchase: goods/services purchased from a supplier/vendor.
- Kharch: business expense such as transport, electricity, rent, packaging, stationery, repairs, etc.

Return ONLY valid JSON matching the requested schema.

Important:
- Use the final payable/grand total, not subtotal.
- Read Gujarati, Hindi and English text.
- Convert Indian number formatting correctly.
- If the bill date is visible, return YYYY-MM-DD.
- If the date cannot be identified, use today's date.
- Do not invent information.
- Confidence must be between 0 and 100.
          `,

          input: [
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: `
Analyze this bill and extract the required information.
          `,
                },

                isPdf
                  ? {
                      type: "input_file",
                      file_data:
                        dataUrl,
                      filename:
                        file.name,
                    }
                  : {
                      type: "input_image",
                      image_url:
                        dataUrl,
                      detail:
                        "high",
                    },
              ],
            },
          ],

          text: {
            format: {
              type: "json_schema",
              name: "bill_extraction",
              strict: true,
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                  shopName: {
                    type: "string",
                  },

                  date: {
                    type: "string",
                  },

                  totalAmount: {
                    type: "number",
                  },

                  items: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },

                  category: {
                    type: "string",
                    enum: [
                      "Sales",
                      "Purchase",
                      "Kharch",
                    ],
                  },

                  confidence: {
                    type: "number",
                  },
                },

                required: [
                  "shopName",
                  "date",
                  "totalAmount",
                  "items",
                  "category",
                  "confidence",
                ],
              },
            },
          },
        }
      );

    const output =
      response.output_text;

    if (!output) {
      throw new Error(
        "OpenAI returned an empty response."
      );
    }

    const parsed: unknown =
      JSON.parse(output);

    const bill =
      normalizeBill(parsed);

    return NextResponse.json({
      success: true,
      data: bill,
    });
  } catch (error) {
    console.error(
      "Bill extraction error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to process bill.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}