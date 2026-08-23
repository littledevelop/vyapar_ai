"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { jsPDF } from "jspdf";
import Image from "next/image";

import {
  ArrowDownRight,
  ArrowUpRight,
  Download,
  Eye,
  EyeOff,
  FileText,
  MessageCircle,
  Pencil,
  Receipt,
  Search,
  ShoppingCart,
  Sparkles,
  Trash2,
  Upload,
  Wallet,
  X,
  IndianRupee,
} from "lucide-react";
import { mockOCR } from "../lib/ai";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const STORAGE_KEY = "vyapar_bills";
const USER_KEY = "vyapar_user";
const REGISTERED_USERS_KEY = "vyapar_registered_users";
const USER_BILLS_PREFIX = "vyapar_bills_user_";
const LANG_KEY = "vyapar_lang";

const PRIMARY = "#1E3A8A";
const PROFIT_GREEN = "#10B981";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const CATEGORIES = ["Sales", "Purchase", "Kharch"] as const;

type Category = (typeof CATEGORIES)[number];

type Lang = "EN" | "HI" | "GU";

type UserProfile = {
  id: string;
  name: string;
  businessName: string;
};

type RegisteredUser = UserProfile & {
  email: string;
  password: string;
};

type AuthUser = UserProfile & {
  email: string;
  isLoggedIn: boolean;
};

const USER_PROFILES: UserProfile[] = [
  {
    id: "owner",
    name: "Rajesh Patel",
    businessName: "Patel Kirana",
  },
  {
    id: "meena",
    name: "Meena Shah",
    businessName: "Shah Medical",
  },
];

const PIE_COLORS: Record<Category, string> = {
  Sales: "#10B981",
  Purchase: "#1E3A8A",
  Kharch: "#F59E0B",
};

type Bill = {
  id: string;
  shopName: string;
  date: string;
  totalAmount: number;
  items: string[];
  category: Category;
  confidence: number;
  imageDataUrl?: string;
};

type Extracted = Omit<Bill, "id">;

type Copy = {
  tagline: string;
  cta: string;
  heroTitle: string;
  heroSub: string;
  billsParsed: string;
  profitTracked: string;
  timeSaved: string;
  uploadTitle: string;
  uploadHint: string;
  uploadBtn: string;
  sampleBill: string;
  extracting: string;
  preview: string;
  extracted: string;
  shop: string;
  date: string;
  amount: string;
  items: string;
  category: string;
  confidence: string;
  save: string;
  saved: string;
  updated: string;
  noPreview: string;
  dashboard: string;
  totalSales: string;
  totalPurchase: string;
  totalKharch: string;
  netProfit: string;
  monthly: string;
  pieTitle: string;
  vendors: string;
  billsCount: string;
  noVendors: string;
  brain: string;
  speak: string;
  whatsapp: string;
  pdf: string;
  recent: string;
  search: string;
  all: string;
  action: string;
  delete: string;
  edit: string;
  editTitle: string;
  saveChanges: string;
  cancel: string;
  emptyTitle: string;
  emptySub: string;
  noResults: string;
  noImage: string;
  catSales: string;
  catPurchase: string;
  catKharch: string;
  speakTpl: string;
  waTpl: string;
  insightKharch: string;
  insightDay: string;
  insightUp: string;
  insightDown: string;
  invalidFile: string;
  fileTooLarge: string;
};

const en: Copy = {
  tagline: "Bill Parser & Vyapar Intelligence",
  cta: "Start for Free",
  heroTitle: "Business accounts, with AI",
  heroSub:
    "Upload a bill photo — VyaparAI extracts useful business data and shows your profit in Gujarati, Hindi and English.",
  billsParsed: "Bills parsed",
  profitTracked: "Profit tracked",
  timeSaved: "Time saved",
  uploadTitle: "Drop the bill photo here — JPG, PNG, PDF",
  uploadHint: "Drag and drop or click to browse",
  uploadBtn: "Upload",
  sampleBill: "Download sample Gujarati bill",
  extracting: "AI is reading the bill…",
  preview: "Uploaded bill",
  extracted: "Extracted data",
  shop: "Shop name",
  date: "Date",
  amount: "Amount",
  items: "Items",
  category: "Category",
  confidence: "Confidence",
  save: "Save bill",
  saved: "Bill saved",
  updated: "Category updated",
  noPreview: "PDF / no image preview",
  dashboard: "Dashboard",
  totalSales: "Total sales",
  totalPurchase: "Total purchase",
  totalKharch: "Total expense",
  netProfit: "Net profit",
  monthly: "Monthly profit (last 6 months)",
  pieTitle: "Category mix",
  vendors: "Top vendors",
  billsCount: "bills",
  noVendors: "No vendors yet",
  brain: "AI advice — Vyapar Brain",
  speak: "🔊 Profit Suno",
  whatsapp: "WhatsApp Par Bhejo",
  pdf: "Download PDF Report",
  recent: "Recent bills",
  search: "Search shop, date, amount or item…",
  all: "All",
  action: "Action",
  delete: "Delete",
  edit: "Edit",
  editTitle: "Edit bill category",
  saveChanges: "Save changes",
  cancel: "Cancel",
  emptyTitle: "No bills yet — upload your first bill",
  emptySub:
    "Upload a kirana, medical or business bill. The extracted information will appear here.",
  noResults: "No bills match this search",
  noImage: "Upload a bill to see preview",
  catSales: "Sales",
  catPurchase: "Purchase",
  catKharch: "Expense",
  speakTpl: "Your total profit is {x} rupees",
  waTpl:
    "My profit report from VyaparAI PRO:\nSales: {s}\nPurchase: {p}\nExpense: {k}\nNet profit: {n}",
  insightKharch: "Expense is {x}% of mix — {shop} appears {n} times",
  insightDay: "Most sales happen on {day}",
  insightUp: "Profit is {p}% higher than last month",
  insightDown: "Profit is {p}% lower than last month",
  invalidFile: "Please upload a JPG, PNG or PDF bill.",
  fileTooLarge: "File is too large. Maximum allowed size is 10 MB.",
};

const hi: Copy = {
  ...en,
  tagline: "बिल पार्सर और व्यापार इंटेलिजेंस",
  cta: "फ्री में शुरू करें",
  heroTitle: "व्यापार का हिसाब, एआई के साथ",
  heroSub:
    "बिल का फोटो अपलोड करें — VyaparAI जानकारी निकालेगा और मुनाफा दिखाएगा।",
  billsParsed: "पार्स किए बिल",
  profitTracked: "ट्रैक किया मुनाफा",
  timeSaved: "बचाया समय",
  uploadTitle: "बिल का फोटो यहाँ डालें — JPG, PNG, PDF",
  uploadHint: "खींचकर छोड़ें या क्लिक करके चुनें",
  uploadBtn: "अपलोड",
  sampleBill: "नमूना गुजराती बिल डाउनलोड करें",
  extracting: "एआई बिल पढ़ रहा है…",
  preview: "अपलोड किया बिल",
  extracted: "निकाला गया डेटा",
  shop: "दुकान का नाम",
  date: "तारीख",
  amount: "राशि",
  items: "सामान",
  category: "श्रेणी",
  confidence: "विश्वास",
  save: "बिल सहेजें",
  saved: "बिल सहेज लिया",
  updated: "श्रेणी अपडेट हो गई",
  noPreview: "पीडीएफ / पूर्वावलोकन नहीं",
  dashboard: "डैशबोर्ड",
  totalSales: "कुल बिक्री",
  totalPurchase: "कुल खरीद",
  totalKharch: "कुल खर्च",
  netProfit: "शुद्ध लाभ",
  monthly: "मासिक लाभ (पिछले 6 महीने)",
  pieTitle: "श्रेणी मिश्रण",
  vendors: "शीर्ष विक्रेता",
  billsCount: "बिल",
  noVendors: "अभी कोई विक्रेता नहीं",
  brain: "एआई सलाह — व्यापार ब्रेन",
  recent: "हाल के बिल",
  search: "दुकान, तारीख, राशि या सामान खोजें…",
  all: "सभी",
  action: "कार्रवाई",
  delete: "हटाएँ",
  edit: "संपादित करें",
  editTitle: "बिल की श्रेणी बदलें",
  saveChanges: "बदलाव सहेजें",
  cancel: "रद्द करें",
  emptyTitle: "कोई बिल नहीं है — पहला बिल अपलोड करें",
  emptySub:
    "किराना, मेडिकल या बिजनेस बिल अपलोड करें। निकाली गई जानकारी यहाँ दिखाई देगी।",
  noResults: "इस खोज से कोई बिल नहीं मिला",
  noImage: "पूर्वावलोकन के लिए बिल अपलोड करें",
  catSales: "बिक्री",
  catPurchase: "खरीद",
  catKharch: "खर्च",
  speakTpl: "आपका कुल मुनाफा {x} रुपये है",
  waTpl:
    "VyaparAI PRO से मेरी मुनाफा रिपोर्ट:\nबिक्री: {s}\nखरीद: {p}\nखर्च: {k}\nशुद्ध लाभ: {n}",
  insightKharch: "खर्च {x}% है — {shop} {n} बार दिखाई देता है",
  insightDay: "{day} को सबसे ज्यादा बिक्री होती है",
  insightUp: "लाभ पिछले महीने से {p}% ज्यादा है",
  insightDown: "लाभ पिछले महीने से {p}% कम है",
  invalidFile: "कृपया JPG, PNG या PDF बिल अपलोड करें।",
  fileTooLarge: "फाइल बहुत बड़ी है। अधिकतम सीमा 10 MB है।",
};

const gu: Copy = {
  ...en,
  tagline: "બિલ પાર્સર અને વ્યાપાર ઇન્ટેલિજન્સ",
  cta: "ફ્રીમાં શરૂ કરો",
  heroTitle: "વ્યાપારનો હિસાબ, એઆઈ સાથે",
  heroSub:
    "બિલનો ફોટો અપલોડ કરો — VyaparAI માહિતી કાઢશે અને નફો બતાવશે.",
  billsParsed: "પાર્સ થયેલા બિલ",
  profitTracked: "ટ્રેક કરેલો નફો",
  timeSaved: "બચાવેલો સમય",
  uploadTitle: "બિલનો ફોટો અહીં મૂકો — JPG, PNG, PDF",
  uploadHint: "ખેંચીને મૂકો અથવા ક્લિક કરીને પસંદ કરો",
  uploadBtn: "અપલોડ",
  sampleBill: "નમૂનો ગુજરાતી બિલ ડાઉનલોડ કરો",
  extracting: "એઆઈ બિલ વાંચી રહ્યું છે…",
  preview: "અપલોડ થયેલું બિલ",
  extracted: "નિકાળેલો ડેટા",
  shop: "દુકાનનું નામ",
  date: "તારીખ",
  amount: "રકમ",
  items: "વસ્તુઓ",
  category: "શ્રેણી",
  confidence: "વિશ્વાસ",
  save: "બિલ સાચવો",
  saved: "બિલ સાચવાયું",
  updated: "શ્રેણી અપડેટ થઈ",
  noPreview: "પીડીએફ / પૂર્વાવલોકન નથી",
  dashboard: "ડેશબોર્ડ",
  totalSales: "કુલ વેચાણ",
  totalPurchase: "કુલ ખરીદી",
  totalKharch: "કુલ ખર્ચ",
  netProfit: "ચોખ્ખો નફો",
  monthly: "માસિક નફો (છેલ્લા 6 મહિના)",
  pieTitle: "શ્રેણી મિશ્રણ",
  vendors: "ટોચના વેચનાર",
  billsCount: "બિલ",
  noVendors: "હજુ કોઈ વેચનાર નથી",
  brain: "એઆઈ સલાહ — વ્યાપાર બ્રેઇન",
  recent: "તાજેતરના બિલ",
  search: "દુકાન, તારીખ, રકમ અથવા વસ્તુ શોધો…",
  all: "બધા",
  action: "ક્રિયા",
  delete: "કાઢી નાખો",
  edit: "સંપાદિત કરો",
  editTitle: "બિલની શ્રેણી બદલો",
  saveChanges: "ફેરફાર સાચવો",
  cancel: "રદ કરો",
  emptyTitle: "કોઈ બિલ નથી — પહેલું બિલ અપલોડ કરો",
  emptySub:
    "કિરાણા, મેડિકલ અથવા બિઝનેસ બિલ અપલોડ કરો. કાઢેલી માહિતી અહીં દેખાશે.",
  noResults: "આ શોધ સાથે કોઈ બિલ મળ્યું નહીં",
  noImage: "પૂર્વાવલોકન માટે બિલ અપલોડ કરો",
  catSales: "વેચાણ",
  catPurchase: "ખરીદી",
  catKharch: "ખર્ચ",
  speakTpl: "તમારો કુલ નફો {x} રૂપિયા છે",
  waTpl:
    "VyaparAI PROથી મારી નફા રિપોર્ટ:\nવેચાણ: {s}\nખરીદી: {p}\nખર્ચ: {k}\nચોખ્ખો નફો: {n}",
  insightKharch: "ખર્ચ {x}% છે — {shop} {n} વાર દેખાય છે",
  insightDay: "{day}એ સૌથી વધુ વેચાણ થાય છે",
  insightUp: "નફો પાછલા મહિના કરતાં {p}% વધુ છે",
  insightDown: "નફો પાછલા મહિના કરતાં {p}% ઓછો છે",
  invalidFile: "કૃપા કરીને JPG, PNG અથવા PDF બિલ અપલોડ કરો.",
  fileTooLarge: "ફાઇલ ખૂબ મોટી છે. મહત્તમ મર્યાદા 10 MB છે.",
};

const copy: Record<Lang, Copy> = {
  EN: en,
  HI: hi,
  GU: gu,
};

function isLang(value: string | null): value is Lang {
  return value === "EN" || value === "HI" || value === "GU";
}

function isUserId(
  value: string | null,
  profiles: UserProfile[] = USER_PROFILES
): value is string {
  return profiles.some((profile) => profile.id === value);
}

function isRegisteredUser(value: unknown): value is RegisteredUser {
  if (typeof value !== "object" || value === null) return false;

  const user = value as Partial<RegisteredUser>;
  return (
    typeof user.id === "string" &&
    typeof user.name === "string" &&
    typeof user.businessName === "string" &&
    typeof user.email === "string" &&
    typeof user.password === "string"
  );
}

function billsStorageKey(userId: string): string {
  return `${USER_BILLS_PREFIX}${userId}`;
}

function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}

function isBill(value: unknown): value is Bill {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const bill = value as Partial<Bill>;

  return (
    typeof bill.id === "string" &&
    typeof bill.shopName === "string" &&
    typeof bill.date === "string" &&
    typeof bill.totalAmount === "number" &&
    Number.isFinite(bill.totalAmount) &&
    bill.totalAmount >= 0 &&
    Array.isArray(bill.items) &&
    bill.items.every((item) => typeof item === "string") &&
    typeof bill.category === "string" &&
    isCategory(bill.category) &&
    typeof bill.confidence === "number" &&
    Number.isFinite(bill.confidence)
  );
}

function catLabel(t: Copy, cat: Category): string {
  if (cat === "Sales") return t.catSales;
  if (cat === "Purchase") return t.catPurchase;
  return t.catKharch;
}

function inr(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function isoMonthsAgo(months: number, day = 8): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months, day);
  return d.toISOString().slice(0, 10);
}

function monthKey(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}`;
}

function fillTpl(
  template: string,
  vars: Record<string, string | number>
): string {
  return Object.entries(vars).reduce(
    (result, [key, value]) =>
      result.split(`{${key}}`).join(String(value)),
    template
  );
}

function sumBy(bills: Bill[], category: Category): number {
  return bills
    .filter((bill) => bill.category === category)
    .reduce((sum, bill) => sum + bill.totalAmount, 0);
}

function sampleBills(): Bill[] {
  return [
    {
      id: "sample-1",
      shopName: "Patel Kirana Bayad",
      date: isoMonthsAgo(0, 12),
      totalAmount: 8750,
      items: ["Rice 5kg", "Oil 1L", "Sugar 2kg"],
      category: "Sales",
      confidence: 98,
    },
    {
      id: "sample-2",
      shopName: "Shree Medical Mehsana",
      date: isoMonthsAgo(1, 6),
      totalAmount: 4320,
      items: ["Medicine", "Gloves", "Syrup"],
      category: "Purchase",
      confidence: 97,
    },
    {
      id: "sample-3",
      shopName: "Gujarat Traders Surat",
      date: isoMonthsAgo(0, 20),
      totalAmount: 1650,
      items: ["Transport", "Packaging", "Stationery"],
      category: "Kharch",
      confidence: 96,
    },
  ];
}

function last6MonthKeys(
  lang: Lang
): Array<{ key: string; label: string }> {
  const locale =
    lang === "HI"
      ? "hi-IN"
      : lang === "GU"
        ? "gu-IN"
        : "en-IN";

  const result: Array<{ key: string; label: string }> = [];

  const now = new Date();

  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(
      now.getFullYear(),
      now.getMonth() - i,
      1
    );

    result.push({
      key: `${d.getFullYear()}-${String(
        d.getMonth() + 1
      ).padStart(2, "0")}`,
      label: d.toLocaleString(locale, {
        month: "short",
      }),
    });
  }

  return result;
}

function weekdayName(
  dateStr: string,
  lang: Lang
): string {
  const locale =
    lang === "HI"
      ? "hi-IN"
      : lang === "GU"
        ? "gu-IN"
        : "en-IN";

  return new Date(
    `${dateStr}T00:00:00`
  ).toLocaleDateString(locale, {
    weekday: "long",
  });
}

function downloadSampleGujaratiBill(): void {
  const canvas = document.createElement("canvas");

  canvas.width = 720;
  canvas.height = 1020;

  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  ctx.fillStyle = "#fffaf3";
  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  ctx.strokeStyle = PRIMARY;
  ctx.lineWidth = 8;

  ctx.strokeRect(
    24,
    24,
    canvas.width - 48,
    canvas.height - 48
  );

  ctx.fillStyle = PRIMARY;

  ctx.fillRect(
    24,
    24,
    canvas.width - 48,
    110
  );

  ctx.fillStyle = "#ffffff";
  ctx.font =
    "bold 36px Nirmala UI, Shruti, sans-serif";
  ctx.textAlign = "center";

  ctx.fillText(
    "પટેલ કિરાણા સ્ટોર્સ",
    canvas.width / 2,
    78
  );

  ctx.font =
    "20px Nirmala UI, Shruti, sans-serif";

  ctx.fillText(
    "બાયડ, અરવલ્લી — GSTIN: 24AABCP1234Q1Z5",
    canvas.width / 2,
    112
  );

  ctx.fillStyle = "#0f172a";
  ctx.textAlign = "left";
  ctx.font =
    "18px Nirmala UI, Shruti, sans-serif";

  ctx.fillText(
    "બિલ નં.: GK-2048",
    56,
    180
  );

  ctx.fillText(
    `તારીખ: ${todayISO()}`,
    400,
    180
  );

  ctx.fillText(
    "ગ્રાહક: રમેશભાઈ પટેલ",
    56,
    214
  );

  ctx.beginPath();
  ctx.moveTo(56, 240);
  ctx.lineTo(664, 240);

  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 2;

  ctx.stroke();

  ctx.font =
    "bold 18px Nirmala UI, Shruti, sans-serif";

  ctx.fillText("વસ્તુ", 56, 280);
  ctx.fillText("જથ્થો", 320, 280);
  ctx.fillText("ભાવ", 440, 280);
  ctx.fillText("કુલ", 580, 280);

  const rows: Array<
    [string, string, string, string]
  > = [
    [
      "બાસમતી ચોખા 5 કિ.ગ્રા.",
      "1",
      "₹420",
      "₹420",
    ],
    [
      "સૂર્યમુખી તેલ 1 લિ.",
      "2",
      "₹145",
      "₹290",
    ],
    ["ખાંડ 2 કિ.ગ્રા.", "1", "₹88", "₹88"],
    [
      "તુવેર દાળ 1 કિ.ગ્રા.",
      "1",
      "₹165",
      "₹165",
    ],
    ["મીઠું 1 કિ.ગ્રા.", "1", "₹22", "₹22"],
  ];

  ctx.font =
    "18px Nirmala UI, Shruti, sans-serif";

  rows.forEach((row, index) => {
    const y = 330 + index * 48;

    ctx.fillText(row[0], 56, y);
    ctx.fillText(row[1], 332, y);
    ctx.fillText(row[2], 440, y);
    ctx.fillText(row[3], 580, y);
  });

  ctx.beginPath();
  ctx.moveTo(56, 580);
  ctx.lineTo(664, 580);
  ctx.stroke();

  ctx.font =
    "20px Nirmala UI, Shruti, sans-serif";

  ctx.fillText("ઉપ-કુલ", 400, 630);
  ctx.fillText("₹985", 580, 630);

  ctx.fillText("GST 5%", 400, 668);
  ctx.fillText("₹49", 580, 668);

  ctx.font =
    "bold 28px Nirmala UI, Shruti, sans-serif";

  ctx.fillStyle = PRIMARY;

  ctx.fillText("કુલ રકમ", 400, 720);
  ctx.fillText("₹1,034", 560, 720);

  ctx.fillStyle = "#475569";

  ctx.font =
    "16px Nirmala UI, Shruti, sans-serif";

  ctx.textAlign = "center";

  ctx.fillText(
    "આભાર! ફરી પધારજો — VyaparAI PRO નમૂનો બિલ",
    canvas.width / 2,
    860
  );

  canvas.toBlob((blob) => {
    if (!blob) return;

    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "sample-gujarati-bill.png";

    document.body.appendChild(anchor);

    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  }, "image/png");
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("EN");

  const [userId, setUserId] = useState<string | null>(null);

  const [authUser, setAuthUser] =
    useState<AuthUser | null>(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [loginErrors, setLoginErrors] = useState({
    email: "",
    password: "",
  });

  const [registeredUsers, setRegisteredUsers] =
    useState<RegisteredUser[]>([]);

  const [authMode, setAuthMode] =
    useState<"login" | "register">("login");

  const [registration, setRegistration] = useState({
    name: "",
    shopName: "",
    email: "",
    password: "",
  });

  const [registrationErrors, setRegistrationErrors] = useState({
    name: "",
    email: "",
    password: "",
  });

  const t = copy[lang];

  const fileRef =
    useRef<HTMLInputElement>(null);

  const [bills, setBills] =
    useState<Bill[]>([]);

  const [hydrated, setHydrated] =
    useState(false);

  const [dragOver, setDragOver] =
    useState(false);

  const [busy, setBusy] =
    useState(false);

  const [preview, setPreview] =
    useState<string | null>(null);

  const [extracted, setExtracted] =
    useState<Extracted | null>(null);

  const [toast, setToast] =
    useState("");

  const [query, setQuery] =
    useState("");

  const [filterCat, setFilterCat] =
    useState<Category | "All">("All");

  const [editing, setEditing] =
    useState<Bill | null>(null);

  const [editCat, setEditCat] =
    useState<Category>("Sales");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const savedLang = localStorage.getItem(LANG_KEY);
        const savedUser = localStorage.getItem(USER_KEY);
        const savedRegisteredUsers = localStorage.getItem(
          REGISTERED_USERS_KEY
        );
        const parsedUsers: unknown = savedRegisteredUsers
          ? JSON.parse(savedRegisteredUsers)
          : [];
        const storedUsers = Array.isArray(parsedUsers)
          ? parsedUsers.filter(isRegisteredUser)
          : [];
        if (isLang(savedLang)) setLang(savedLang);
        setRegisteredUsers(storedUsers);
        if (savedUser) {
          const parsedUser: unknown = JSON.parse(savedUser);
          if (
            typeof parsedUser === "object" &&
            parsedUser !== null &&
            (parsedUser as AuthUser).isLoggedIn === true
          ) {
            const currentUser = parsedUser as AuthUser;
            setAuthUser(currentUser);
            setUserId(currentUser.id);
          } else if (isUserId(savedUser, [
            ...USER_PROFILES,
            ...storedUsers,
          ])) {
            const profile = [
              ...USER_PROFILES,
              ...storedUsers,
            ].find((item) => item.id === savedUser);
            if (profile) {
              const currentUser: AuthUser = {
                ...profile,
                email: `${profile.id}@vyapar.ai`,
                isLoggedIn: true,
              };
              setAuthUser(currentUser);
              setUserId(currentUser.id);
            }
          }
        }
      } catch {
        // Ignore storage errors.
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const initialize = () => {
      if (!userId) {
        setBills([]);
        setHydrated(true);
        return;
      }

      try {
        const profileKey = billsStorageKey(userId);
        let raw = localStorage.getItem(profileKey);

        if (!raw && userId === "owner") {
          raw = localStorage.getItem(STORAGE_KEY);
          if (raw) localStorage.setItem(profileKey, raw);
        }

        if (!raw) {
          const seed = userId === "owner" ? sampleBills() : [];
          localStorage.setItem(profileKey, JSON.stringify(seed));
          setBills(seed);
        } else {
          const parsed: unknown = JSON.parse(raw);
          setBills(Array.isArray(parsed) ? parsed.filter(isBill) : []);
        }
      } catch {
        setBills([]);
      } finally {
        setHydrated(true);
      }
    };

    const timer = window.setTimeout(initialize, 0);
    return () => window.clearTimeout(timer);
  }, [userId]);

  const persist = useCallback(
    (next: Bill[]) => {
      setBills(next);

      if (!userId) return;

      try {
        localStorage.setItem(
          billsStorageKey(userId),
          JSON.stringify(next)
        );
      } catch (error) {
        console.error(
          "Unable to save bills:",
          error
        );
      }
    },
    [userId]
  );

  const saveSession = (user: AuthUser): void => {
    setHydrated(false);
    setAuthUser(user);
    setUserId(user.id);
    setBills([]);
    setExtracted(null);
    setPreview(null);
    setEditing(null);

    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      // Ignore storage errors.
    }
  };

  const loginUser = (): void => {
    const email = loginEmail.trim().toLowerCase();
    const errors = {
      email: email ? "" : "Email is required",
      password: loginPassword ? "" : "Password is required",
    };
    setLoginErrors(errors);

    if (errors.email || errors.password) return;
    if (loginPassword.length < 6) {
      setLoginErrors({ email: "", password: "Password must be at least 6 characters" });
      return;
    }

    const savedUser = registeredUsers.find(
      (user) => user.email === email
    );
    const emailName = email.split("@")[0]
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
    const user: AuthUser = {
      id: savedUser?.id ?? `user-${email.replace(/[^a-z0-9]/g, "-")}`,
      name: savedUser?.name ?? emailName,
      businessName: savedUser?.businessName ?? "My Kirana Store",
      email,
      isLoggedIn: true,
    };

    saveSession(user);
    setLoginEmail("");
    setLoginPassword("");
    showToast(`Welcome, ${user.name}!`);
  };

  const demoLogin = (): void => {
    const user: AuthUser = {
      id: "demo",
      name: "Demo User",
      businessName: "Patel Kirana & General Store",
      email: "demo@vyapar.ai",
      isLoggedIn: true,
    };
    saveSession(user);
    showToast(`Welcome, ${user.name}!`);
  };

  const logout = (): void => {
    setAuthUser(null);
    setUserId(null);
    setBills([]);
    setExtracted(null);
    setPreview(null);
    setEditing(null);

    try {
      localStorage.removeItem(USER_KEY);
    } catch {
      // Ignore storage errors.
    }
  };

  const registerUser = (): void => {
    const name = registration.name.trim();
    const businessName = registration.shopName.trim();
    const email = registration.email.trim().toLowerCase();
    const password = registration.password;
    const errors = {
      name: name.length >= 3 ? "" : "Full Name must be at least 3 characters",
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "" : "Enter a valid email",
      password: password.length >= 6 ? "" : "Password must be at least 6 characters",
    };
    setRegistrationErrors(errors);

    if (errors.name || errors.email || errors.password) return;

    if (registeredUsers.some((user) => user.email === email)) {
      setRegistrationErrors({
        name: "",
        email: "An account with this email already exists.",
        password: "",
      });
      return;
    }

    const newUser: RegisteredUser = {
      id: `user-${email.replace(/[^a-z0-9]/g, "-")}`,
      name,
      businessName,
      email,
      password,
    };
    const nextUsers = [...registeredUsers, newUser];

    setRegisteredUsers(nextUsers);
    setRegistration({
      name: "",
      shopName: "",
      email: "",
      password: "",
    });

    try {
      localStorage.setItem(
        REGISTERED_USERS_KEY,
        JSON.stringify(nextUsers)
      );
      saveSession({
        id: newUser.id,
        name: newUser.name,
        businessName: newUser.businessName,
        email: newUser.email,
        isLoggedIn: true,
      });
      showToast(`Welcome, ${name}!`);
    } catch {
      setRegistrationErrors({
        name: "",
        email: "Unable to save your account in this browser.",
        password: "",
      });
    }
  };

  const showToast = useCallback(
    (message: string) => {
      setToast(message);

      window.setTimeout(
        () => setToast(""),
        2200
      );
    },
    []
  );

  const changeLang = (code: Lang): void => {
    setLang(code);

    try {
      localStorage.setItem(
        LANG_KEY,
        code
      );
    } catch {
      // Ignore storage errors.
    }
  };

  const sales = useMemo(
    () => sumBy(bills, "Sales"),
    [bills]
  );

  const purchase = useMemo(
    () => sumBy(bills, "Purchase"),
    [bills]
  );

  const kharch = useMemo(
    () => sumBy(bills, "Kharch"),
    [bills]
  );

  const profit =
    sales - purchase - kharch;

  const dashboardSales =
    bills.length > 0 ? sales : 1005;

  const dashboardPurchase =
    bills.length > 0 ? purchase : 27350;

  const dashboardKharch =
    bills.length > 0 ? kharch : 0;

  const dashboardProfit =
    dashboardSales - dashboardPurchase - dashboardKharch;

  const profitUp = profit >= 0;

  const monthlyData = useMemo(() => {
    return last6MonthKeys(lang).map(
      ({ key, label }) => {
        const monthBills =
          bills.filter(
            (bill) =>
              monthKey(bill.date) === key
          );

        const monthSales =
          sumBy(monthBills, "Sales");

        const monthExpenses =
          sumBy(monthBills, "Purchase") +
          sumBy(monthBills, "Kharch");

        return {
          month: label,
          profit:
            monthSales - monthExpenses,
        };
      }
    );
  }, [bills, lang]);

  const pieData = useMemo(
    () =>
      [
        {
          name: t.catSales,
          key: "Sales" as Category,
          value: dashboardSales,
        },
        {
          name: t.catPurchase,
          key: "Purchase" as Category,
          value: dashboardPurchase,
        },
        {
          name: t.catKharch,
          key: "Kharch" as Category,
          value: dashboardKharch,
        },
      ].filter(
        (item) => item.value > 0
      ),
    [
      dashboardSales,
      dashboardPurchase,
      dashboardKharch,
      t,
    ]
  );

  const vendors = useMemo(() => {
    const map = new Map<
      string,
      {
        total: number;
        count: number;
      }
    >();

    bills.forEach((bill) => {
      const current =
        map.get(bill.shopName) ?? {
          total: 0,
          count: 0,
        };

      current.total +=
        bill.totalAmount;

      current.count += 1;

      map.set(
        bill.shopName,
        current
      );
    });

    return [...map.entries()]
      .map(([name, value]) => ({
        name,
        ...value,
      }))
      .sort(
        (a, b) =>
          b.total - a.total
      )
      .slice(0, 5);
  }, [bills]);

  const insights = useMemo(() => {
    const totalMix =
      sales + purchase + kharch;

    const kharchShare =
      totalMix > 0
        ? Math.round(
            (kharch / totalMix) * 100
          )
        : 0;

    const salesByDay =
      new Map<string, number>();

    bills
      .filter(
        (bill) =>
          bill.category === "Sales"
      )
      .forEach((bill) => {
        const day =
          weekdayName(
            bill.date,
            lang
          );

        salesByDay.set(
          day,
          (salesByDay.get(day) ?? 0) +
            bill.totalAmount
        );
      });

    let bestDay =
      weekdayName(
        todayISO(),
        lang
      );

    let bestValue = -1;

    salesByDay.forEach(
      (value, day) => {
        if (value > bestValue) {
          bestValue = value;
          bestDay = day;
        }
      }
    );

    const now = new Date();

    const currentKey =
      monthKey(todayISO());

    const previousKey =
      monthKey(
        new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1
        )
          .toISOString()
          .slice(0, 10)
      );

    const monthProfit =
      (key: string): number => {
        const monthBills =
          bills.filter(
            (bill) =>
              monthKey(bill.date) === key
          );

        return (
          sumBy(
            monthBills,
            "Sales"
          ) -
          sumBy(
            monthBills,
            "Purchase"
          ) -
          sumBy(
            monthBills,
            "Kharch"
          )
        );
      };

    const currentProfit =
      monthProfit(currentKey);

    const previousProfit =
      monthProfit(previousKey);

    const percentage =
      previousProfit === 0
        ? currentProfit === 0
          ? 0
          : 100
        : Math.round(
            ((currentProfit -
              previousProfit) /
              Math.abs(
                previousProfit
              )) *
              100
          );

    const topVendor = vendors[0];

    const shopName =
      topVendor?.name ??
      "your top vendor";

    const shopCount =
      topVendor?.count ?? 0;

    return [
      fillTpl(
        t.insightKharch,
        {
          x: kharchShare,
          n: shopCount,
          shop: shopName,
        }
      ),

      fillTpl(
        t.insightDay,
        {
          day: bestDay,
        }
      ),

      fillTpl(
        percentage >= 0
          ? t.insightUp
          : t.insightDown,
        {
          p: Math.abs(
            percentage
          ),
        }
      ),
    ];
  }, [
    bills,
    lang,
    kharch,
    purchase,
    sales,
    t,
    vendors,
  ]);

  const filtered = useMemo(() => {
    const q =
      query
        .trim()
        .toLowerCase();

    return [...bills]
      .sort(
        (a, b) =>
          b.date.localeCompare(
            a.date
          ) ||
          b.id.localeCompare(
            a.id
          )
      )
      .filter((bill) =>
        filterCat === "All"
          ? true
          : bill.category ===
            filterCat
      )
      .filter((bill) => {
        if (!q) return true;

        const searchable = [
          bill.shopName,
          bill.date,
          String(
            bill.totalAmount
          ),
          inr(
            bill.totalAmount
          ),
          bill.category,
          catLabel(
            t,
            bill.category
          ),
          bill.items.join(" "),
        ]
          .join(" ")
          .toLowerCase();

        return searchable.includes(q);
      })
      .slice(0, 10);
  }, [
    bills,
    filterCat,
    query,
    t,
  ]);

  const processFile = async (
    file: File
  ): Promise<void> => {
    if (!ALLOWED_FILE_TYPES.has(file.type)) {
      showToast(t.invalidFile);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      showToast(t.fileTooLarge);
      return;
    }

    setBusy(true);
    setExtracted(null);

    try {
      await new Promise((resolve) =>
        window.setTimeout(resolve, 1000)
      );

      const result = mockOCR();
      const previewUrl = URL.createObjectURL(file);

      setPreview(previewUrl);
      setExtracted({
        ...result,
        imageDataUrl: previewUrl,
      });

      showToast("Bill read successfully");
    } catch (error) {
      console.error(error);

      showToast(
        error instanceof Error
          ? error.message
          : "Failed to process bill"
      );

      setPreview(null);
      setExtracted(null);
    } finally {
      setBusy(false);
    }
  };

  const onFiles = (
    files: FileList | null
  ): void => {
    const file = files?.[0];

    if (file) {
      void processFile(file);
    }
  };

  const saveBill = (): void => {
    if (!extracted) return;

    // In production, Laravel API: POST /api/bills/store
    const bill: Bill = {
      id: `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      ...extracted,
      imageDataUrl:
        extracted.imageDataUrl ??
        preview ??
        undefined,
    };

    persist([
      bill,
      ...bills,
    ]);

    setExtracted(null);
    setPreview(null);

    showToast(t.saved);
  };

  const deleteBill = (
    id: string
  ): void => {
    persist(
      bills.filter(
        (bill) =>
          bill.id !== id
      )
    );

    if (
      editing?.id === id
    ) {
      setEditing(null);
    }
  };

  const openEdit = (
    bill: Bill
  ): void => {
    setEditing(bill);
    setEditCat(
      bill.category
    );
  };

  const saveEdit = (): void => {
    if (!editing) return;

    persist(
      bills.map((bill) =>
        bill.id === editing.id
          ? {
              ...bill,
              category:
                editCat,
            }
          : bill
      )
    );

    setEditing(null);

    showToast(t.updated);
  };

  const speakProfit = (): void => {
    if (
      !("speechSynthesis" in window)
    ) {
      return;
    }

    const text = fillTpl(
      t.speakTpl,
      {
        x: Math.round(
          profit
        ).toLocaleString(
          "en-IN"
        ),
      }
    );

    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(
        text
      );

    utterance.lang =
      lang === "GU"
        ? "gu-IN"
        : lang === "HI"
          ? "hi-IN"
          : "en-IN";

    window.speechSynthesis.speak(
      utterance
    );
  };

  const sendWhatsApp = (): void => {
    const text = fillTpl(
      t.waTpl,
      {
        s: inr(sales),
        p: inr(purchase),
        k: inr(kharch),
        n: inr(profit),
      }
    );

    const url =
      `https://wa.me/?text=${encodeURIComponent(
        text
      )}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const downloadPdf = (): void => {
    const doc =
      new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(
      30,
      58,
      138
    );

    doc.text(
      "VyaparAI PRO",
      14,
      20
    );

    doc.setFontSize(11);

    doc.setTextColor(
      15,
      23,
      42
    );

    doc.text(
      `${t.netProfit}: ${inr(
        profit
      )}`,
      14,
      30
    );

    doc.text(
      new Date().toLocaleString(
        "en-IN"
      ),
      14,
      38
    );

    let y = 52;

    doc.setFontSize(10);

    doc.text(
      t.shop,
      14,
      y
    );

    doc.text(
      t.date,
      90,
      y
    );

    doc.text(
      t.category,
      120,
      y
    );

    doc.text(
      t.amount,
      160,
      y
    );

    y += 6;

    doc.line(
      14,
      y,
      196,
      y
    );

    y += 8;

    bills
      .slice(0, 20)
      .forEach((bill) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }

        doc.text(
          bill.shopName.slice(
            0,
            32
          ),
          14,
          y
        );

        doc.text(
          bill.date,
          90,
          y
        );

        doc.text(
          catLabel(
            t,
            bill.category
          ),
          120,
          y
        );

        doc.text(
          inr(
            bill.totalAmount
          ),
          160,
          y
        );

        y += 8;
      });

    y += 6;

    doc.text(
      `${t.totalSales}: ${inr(
        sales
      )}`,
      14,
      y
    );

    y += 7;

    doc.text(
      `${t.totalPurchase}: ${inr(
        purchase
      )}`,
      14,
      y
    );

    y += 7;

    doc.text(
      `${t.totalKharch}: ${inr(
        kharch
      )}`,
      14,
      y
    );

    y += 7;

    doc.setTextColor(
      profitUp ? 16 : 220,
      profitUp ? 185 : 38,
      profitUp ? 129 : 38
    );

    doc.text(
      `${t.netProfit}: ${inr(
        profit
      )}`,
      14,
      y
    );

    doc.save(
      "vyaparai-profit-report.pdf"
    );
  };

  const badge = (
    category: Category
  ): ReactNode => {
    const styles: Record<
      Category,
      string
    > = {
      Sales:
        "bg-emerald-50 text-emerald-700 border-emerald-200",
      Purchase:
        "bg-blue-50 text-[#1E3A8A] border-blue-200",
      Kharch:
        "bg-red-50 text-red-700 border-red-200",
    };

    return (
      <span
        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[category]}`}
      >
        {catLabel(
          t,
          category
        )}
      </span>
    );
  };

  const activeProfile = authUser;

  if (hydrated && !userId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-900">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
          <p className="text-xl font-bold" style={{ color: PRIMARY }}>
            VyaparAI <span className="font-extrabold">PRO</span>
          </p>
          <h1 className="mt-8 text-2xl font-bold">Login to your business</h1>
          <p className="mt-2 text-sm text-slate-500">
            Only one user can be logged in at a time. Your bills stay separate.
          </p>
          <div className="mt-6 flex rounded-lg bg-slate-100 p-1 text-sm font-semibold">
            {(["login", "register"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setAuthMode(mode);
                  setLoginErrors({ email: "", password: "" });
                  setRegistrationErrors({ name: "", email: "", password: "" });
                }}
                className={`flex-1 rounded-md px-3 py-2 ${
                  authMode === mode
                    ? "bg-white text-[#1E3A8A] shadow-sm"
                    : "text-slate-500"
                }`}
              >
                {mode === "login" ? "Login" : "Register"}
              </button>
            ))}
          </div>

          {authMode === "login" ? (
            <>
              <label className="mt-6 block text-sm font-semibold text-slate-700">
                Email
                <input
                  type="email"
                  value={loginEmail}
                  placeholder="ramesh@patelkirana.com"
                  onChange={(event) => setLoginEmail(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-[#1E3A8A]"
                />
                {loginErrors.email && <span className="mt-1 block text-sm text-red-600">{loginErrors.email}</span>}
              </label>
              <label className="mt-4 block text-sm font-semibold text-slate-700">
                Password
                <span className="relative mt-2 block">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(event) => setLoginPassword(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-11 font-normal outline-none focus:border-[#1E3A8A]"
                  />
                  <button type="button" aria-label="Show password" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-500">
                    {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </span>
                {loginErrors.password && <span className="mt-1 block text-sm text-red-600">{loginErrors.password}</span>}
              </label>
              <button
                type="button"
                onClick={loginUser}
                className="mt-6 w-full rounded-full bg-[#0f172a] px-4 py-3 font-bold text-white shadow-lg hover:scale-105"
              >
                Login
              </button>
              <button type="button" onClick={demoLogin} className="mt-3 w-full rounded-full border border-slate-300 px-4 py-3 font-bold text-slate-700 hover:scale-105">
                Try Demo Account
              </button>
              <p className="mt-4 text-center text-sm text-slate-500">
                Don&apos;t have an account? <button type="button" onClick={() => setAuthMode("register")} className="font-bold text-[#1E3A8A]">Register</button>
              </p>
            </>
          ) : (
            <div className="mt-6 space-y-3">
              <label className="block text-sm font-semibold text-slate-700">Full Name (required)
                <input type="text" placeholder="Ramesh Bhai Patel" value={registration.name} onChange={(event) => setRegistration({ ...registration, name: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-[#1E3A8A]" />
                {registrationErrors.name && <span className="mt-1 block text-sm text-red-600">{registrationErrors.name}</span>}
              </label>
              <label className="block text-sm font-semibold text-slate-700">Email (required)
                <input type="email" placeholder="ramesh@patelkirana.com" value={registration.email} onChange={(event) => setRegistration({ ...registration, email: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-[#1E3A8A]" />
                {registrationErrors.email && <span className="mt-1 block text-sm text-red-600">{registrationErrors.email}</span>}
              </label>
              <label className="block text-sm font-semibold text-slate-700">Password (required)
                <span className="relative mt-1 block"><input type={showRegisterPassword ? "text" : "password"} value={registration.password} onChange={(event) => setRegistration({ ...registration, password: event.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-11 font-normal outline-none focus:border-[#1E3A8A]" /><button type="button" aria-label="Show password" onClick={() => setShowRegisterPassword(!showRegisterPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-500">{showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span>
                {registrationErrors.password && <span className="mt-1 block text-sm text-red-600">{registrationErrors.password}</span>}
              </label>
              <label className="block text-sm font-semibold text-slate-700">Shop Name (optional)
                <input type="text" placeholder="Patel Kirana & General Store" value={registration.shopName} onChange={(event) => setRegistration({ ...registration, shopName: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-[#1E3A8A]" />
              </label>
              <button
                type="button"
                onClick={registerUser}
                className="w-full rounded-full bg-[#0f172a] px-4 py-3 font-bold text-white shadow-lg hover:scale-105"
              >
                Create account
              </button>
              <p className="text-center text-sm text-slate-500">Already have an account? <button type="button" onClick={() => setAuthMode("login")} className="font-bold text-[#1E3A8A]">Login</button></p>
            </div>
          )}
        </section>
      </main>
    );
  }

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-900"
      lang={
        lang === "HI"
          ? "hi"
          : lang === "GU"
            ? "gu"
            : "en"
      }
    >
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <a
            href="#top"
            className="text-xl font-bold tracking-tight"
            style={{
              color: PRIMARY,
            }}
          >
            VyaparAI{" "}
            <span className="font-extrabold">
              PRO
            </span>
          </a>

          <div className="flex items-center gap-2 sm:gap-3">
            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-slate-200 px-2 py-1.5 text-left text-xs font-semibold text-slate-700 shadow-sm">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0f172a] font-bold text-white">
                  {activeProfile?.name.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-24 truncate">{activeProfile?.name}</span>
              </summary>
              <div className="absolute right-0 top-12 z-50 min-w-48 rounded-xl border border-slate-200 bg-white p-3 shadow-2xl">
                <p className="text-xs font-semibold text-slate-700">{activeProfile?.businessName}</p>
                <p className="mt-1 truncate text-xs text-slate-500">{activeProfile?.email}</p>
                <button type="button" onClick={logout} className="mt-3 w-full rounded-full bg-[#0f172a] px-3 py-2 text-xs font-bold text-white shadow-lg hover:scale-105">Logout</button>
              </div>
            </details>

            <div className="flex w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold sm:w-auto sm:text-sm">
              {(
                [
                  "EN",
                  "HI",
                  "GU",
                ] as const
              ).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() =>
                    changeLang(
                      code
                    )
                  }
                  className={`flex-1 px-3 py-1.5 text-center sm:flex-none sm:px-3 ${
                    lang === code
                      ? "bg-[#1E3A8A] text-white"
                      : "text-slate-600 hover:bg-white"
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>

            <a
              href="#upload"
              className="rounded-full bg-[#1E3A8A] px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:scale-105 hover:bg-blue-900 sm:px-4 sm:text-sm"
            >
              {t.cta}
            </a>
          </div>
        </div>
      </header>

      <main
        id="top"
        className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:py-12"
      >
        <section className="rounded-3xl bg-white p-6 shadow-lg shadow-slate-200/60 sm:p-10">
          <p className="mb-2 text-sm font-semibold text-[#1E3A8A]">
            {t.tagline}
          </p>

          <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight text-slate-900 sm:text-6xl">
            VyaparAI PRO - AI for Bharat&apos;s Kirana
          </h1>

          <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
            Upload Gujarati/Hindi/English bill photo. AI auto-reads ₹ total, shop name, items in 2 seconds.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatCard
              label={t.billsParsed}
              value={`${bills.length}`}
            />

            <StatCard
              label={t.profitTracked}
              value={inr(profit)}
            />

            <StatCard
              label={t.timeSaved}
              value={`${Math.min(
                bills.length * 5,
                999
              )} min`}
            />
          </div>
        </section>

        <section
          id="upload"
          className="scroll-mt-24"
        >
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() =>
              setDragOver(false)
            }
            onDrop={(event) => {
              event.preventDefault();
              setDragOver(false);
              onFiles(
                event.dataTransfer.files
              );
            }}
            className={`rounded-3xl border-2 border-dashed border-blue-500 bg-blue-50 p-8 text-center shadow-lg transition ${
              dragOver
                ? "border-[#1E3A8A] bg-blue-50"
                : "border-blue-500"
            }`}
          >
            <Upload className="mx-auto h-14 w-14 text-[#1E3A8A]" />

            <h2 className="mt-3 text-lg font-bold sm:text-xl">
              Drop the bill photo here — JPG, PNG, PDF
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {t.uploadHint}
            </p>

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={(event) => {
                onFiles(
                  event.target.files
                );

                event.target.value =
                  "";
              }}
            />

            <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() =>
                  fileRef.current?.click()
                }
                className="rounded-full bg-[#1E3A8A] px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:scale-105 hover:bg-blue-900"
              >
                {t.uploadBtn}
              </button>

              <button
                type="button"
                onClick={
                  downloadSampleGujaratiBill
                }
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#1E3A8A] shadow-lg transition hover:scale-105 hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                {t.sampleBill}
              </button>
            </div>

            {busy && (
              <p className="mt-3 text-sm font-medium text-[#1E3A8A]">
                {t.extracting}
              </p>
            )}
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm font-semibold text-slate-700">
            <span className="rounded-full bg-white px-4 py-2 shadow-sm">✓ 100% Offline</span>
            <span className="rounded-full bg-white px-4 py-2 shadow-sm">✓ Gujarati + Hindi + English</span>
            <span className="rounded-full bg-white px-4 py-2 shadow-sm">✓ No typing needed</span>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl bg-white p-5 shadow-lg">
              <h3 className="mb-3 font-semibold text-slate-800">
                {t.preview}
              </h3>

              {preview ? (
                <Image
                  src={preview}
                  alt="Uploaded bill preview"
                  width={1200}
                  height={800}
                  unoptimized
                  className="max-h-80 w-full rounded-2xl bg-slate-50 object-contain"
                />
              ) : (
                <div className="flex h-64 flex-col items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                  <FileText className="mb-2 h-10 w-10" />

                  <p className="text-sm">
                    {extracted
                      ? t.noPreview
                      : t.noImage}
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-lg">
              <h3 className="mb-3 font-semibold text-slate-800">
                {t.extracted}
              </h3>

              {extracted ? (
                <div className="space-y-3 text-sm">
                  <Row
                    label={t.shop}
                    value={
                      extracted.shopName
                    }
                  />

                  <Row
                    label={t.date}
                    value={
                      extracted.date
                    }
                  />

                  <Row
                    label={t.amount}
                    value={inr(
                      extracted.totalAmount
                    )}
                  />

                  <Row
                    label={t.items}
                    value={extracted.items.join(
                      ", "
                    )}
                  />

                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-2">
                    <span className="text-slate-500">
                      {t.category}
                    </span>

                    {badge(
                      extracted.category
                    )}
                  </div>

                  <Row
                    label={
                      t.confidence
                    }
                    value={`${extracted.confidence}%`}
                  />

                  <button
                    type="button"
                    onClick={saveBill}
                    className="mt-2 w-full rounded-xl bg-[#10B981] px-4 py-3 font-semibold text-white shadow-lg hover:bg-emerald-600"
                  >
                    {t.save}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  {t.noImage}
                </p>
              )}
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-1 text-xl font-bold">
            Namaste, {activeProfile?.name} 👋
          </h2>
          <p className="mb-4 text-sm text-slate-500">
            {activeProfile?.businessName}
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi
              title={
                t.totalSales
              }
              value={dashboardSales}
              icon={
                <IndianRupee className="h-5 w-5" />
              }
              ready={hydrated}
            />

            <Kpi
              title={
                t.totalPurchase
              }
              value={dashboardPurchase}
              icon={
                <ShoppingCart className="h-5 w-5" />
              }
              ready={hydrated}
            />

            <Kpi
              title={
                t.totalKharch
              }
              value={dashboardKharch}
              icon={
                <Receipt className="h-5 w-5" />
              }
              ready={hydrated}
            />

            <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-lg">
              <p className="flex items-center justify-between text-sm font-medium text-slate-500">
                {t.netProfit}
                <Wallet className="h-4 w-4" />
              </p>

              <div className="mt-2 flex items-end justify-between">
                <CountInr
                  value={dashboardProfit}
                  ready={hydrated}
                  className="text-2xl font-extrabold"
                  style={{
                    color:
                      profitUp
                        ? PROFIT_GREEN
                        : "#EF4444",
                  }}
                />

                {profitUp ? (
                  <ArrowUpRight
                    className="h-6 w-6"
                    style={{
                      color:
                        PROFIT_GREEN,
                    }}
                  />
                ) : (
                  <ArrowDownRight className="h-6 w-6 text-red-500" />
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl bg-white p-5 shadow-lg lg:col-span-2">
              <h3 className="mb-4 font-semibold">
                {t.monthly}
              </h3>

              <div className="h-72">
                {hydrated && (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={
                        monthlyData
                      }
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#E2E8F0"
                      />

                      <XAxis
                        dataKey="month"
                        tick={{
                          fontSize: 12,
                        }}
                      />

                      <YAxis
                        tick={{
                          fontSize: 12,
                        }}
                      />

                      <Tooltip
                        formatter={(
                          value
                        ) =>
                          inr(
                            Number(
                              value ?? 0
                            )
                          )
                        }
                      />

                      <Bar
                        dataKey="profit"
                        fill={PRIMARY}
                        radius={[
                          8,
                          8,
                          0,
                          0,
                        ]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-lg">
              <h3 className="mb-4 font-semibold">
                {t.pieTitle}
              </h3>

              <div className="h-72">
                {hydrated &&
                  pieData.length >
                    0 && (
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <PieChart>
                        <Pie
                          data={
                            pieData
                          }
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={
                            80
                          }
                          label
                        >
                          {pieData.map(
                            (
                              item
                            ) => (
                              <Cell
                                key={
                                  item.key
                                }
                                fill={
                                  PIE_COLORS[
                                    item.key
                                  ]
                                }
                              />
                            )
                          )}
                        </Pie>

                        <Tooltip
                          formatter={(
                            value
                          ) =>
                            inr(
                              Number(
                                value ??
                                  0
                              )
                            )
                          }
                        />

                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-3xl bg-white p-5 shadow-lg">
            <h3 className="mb-4 font-semibold">
              {t.vendors}
            </h3>

            {vendors.length ===
            0 ? (
              <p className="text-sm text-slate-400">
                {t.noVendors}
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {vendors.map(
                  (
                    vendor,
                    index
                  ) => (
                    <li
                      key={
                        vendor.name
                      }
                      className="flex items-center justify-between py-3"
                    >
                      <div>
                        <p className="font-medium">
                          {index +
                            1}.{" "}
                          {
                            vendor.name
                          }
                        </p>

                        <p className="text-xs text-slate-500">
                          {
                            vendor.count
                          }{" "}
                          {
                            t.billsCount
                          }
                        </p>
                      </div>

                      <p className="font-semibold text-[#1E3A8A]">
                        {inr(
                          vendor.total
                        )}
                      </p>
                    </li>
                  )
                )}
              </ul>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-blue-100 bg-linear-to-br from-white to-blue-50 p-6 shadow-lg">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#1E3A8A]" />

            <h2 className="text-lg font-bold">
              {t.brain}
            </h2>
          </div>

          <ul className="space-y-3">
            {insights.map(
              (line) => (
                <li
                  key={line}
                  className="rounded-2xl bg-white px-4 py-3 text-sm shadow-sm"
                >
                  {line}
                </li>
              )
            )}
          </ul>
        </section>

        <section className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={
              speakProfit
            }
            className="flex-1 rounded-xl bg-[#1E3A8A] px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-blue-900"
          >
            {t.speak}
          </button>

          <button
            type="button"
            onClick={
              sendWhatsApp
            }
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-green-600"
          >
            <MessageCircle className="h-4 w-4" />

            {t.whatsapp}
          </button>

          <button
            type="button"
            onClick={
              downloadPdf
            }
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold shadow-lg hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />

            {t.pdf}
          </button>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-lg">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold">
              {t.recent}
            </h2>

            <div className="flex flex-1 flex-col gap-2 sm:max-w-lg sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />

                <input
                  value={query}
                  onChange={(
                    event
                  ) =>
                    setQuery(
                      event.target
                        .value
                    )
                  }
                  placeholder={
                    t.search
                  }
                  className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#1E3A8A]"
                />
              </div>

              <select
                value={
                  filterCat
                }
                onChange={(
                  event
                ) => {
                  const value =
                    event.target
                      .value;

                  setFilterCat(
                    value ===
                      "All" ||
                    isCategory(
                      value
                    )
                      ? value
                      : "All"
                  );
                }}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1E3A8A]"
              >
                <option value="All">
                  {t.all}
                </option>

                {CATEGORIES.map(
                  (
                    category
                  ) => (
                    <option
                      key={
                        category
                      }
                      value={
                        category
                      }
                    >
                      {catLabel(
                        t,
                        category
                      )}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          {bills.length ===
          0 ? (
            <EmptyBills
              t={t}
              onUpload={() =>
                fileRef.current?.click()
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-180 text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500">
                    <th className="py-3 font-medium">
                      {t.date}
                    </th>

                    <th className="py-3 font-medium">
                      {t.shop}
                    </th>

                    <th className="py-3 font-medium">
                      {t.amount}
                    </th>

                    <th className="py-3 font-medium">
                      {t.category}
                    </th>

                    <th className="py-3 font-medium">
                      {t.action}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={
                          5
                        }
                        className="py-8 text-center text-slate-400"
                      >
                        {
                          t.noResults
                        }
                      </td>
                    </tr>
                  )}

                  {filtered.map(
                    (bill) => (
                      <tr
                        key={
                          bill.id
                        }
                        className="border-b border-slate-50"
                      >
                        <td className="py-3">
                          {
                            bill.date
                          }
                        </td>

                        <td className="py-3 font-medium">
                          {
                            bill.shopName
                          }
                        </td>

                        <td className="py-3">
                          {inr(
                            bill.totalAmount
                          )}
                        </td>

                        <td className="py-3">
                          {badge(
                            bill.category
                          )}
                        </td>

                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                openEdit(
                                  bill
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[#1E3A8A] hover:bg-blue-50"
                            >
                              <Pencil className="h-4 w-4" />

                              {
                                t.edit
                              }
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deleteBill(
                                  bill.id
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />

                              {
                                t.delete
                              }
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold">
                  {t.editTitle}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {
                    editing.shopName
                  }
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setEditing(null)
                }
                className="rounded-lg p-1 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <Row
                label={t.date}
                value={
                  editing.date
                }
              />

              <Row
                label={t.amount}
                value={inr(
                  editing.totalAmount
                )}
              />

              <label className="block">
                <span className="mb-1.5 block text-slate-500">
                  {
                    t.category
                  }
                </span>

                <select
                  value={editCat}
                  onChange={(
                    event
                  ) => {
                    const value =
                      event.target
                        .value;

                    if (
                      isCategory(
                        value
                      )
                    ) {
                      setEditCat(
                        value
                      );
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-[#1E3A8A]"
                >
                  {CATEGORIES.map(
                    (
                      category
                    ) => (
                      <option
                        key={
                          category
                        }
                        value={
                          category
                        }
                      >
                        {catLabel(
                          t,
                          category
                        )}
                      </option>
                    )
                  )}
                </select>
              </label>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setEditing(null)
                }
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 font-semibold hover:bg-slate-50"
              >
                {t.cancel}
              </button>

              <button
                type="button"
                onClick={
                  saveEdit
                }
                className="flex-1 rounded-xl bg-[#1E3A8A] px-4 py-2.5 font-semibold text-white hover:bg-blue-900"
              >
                {
                  t.saveChanges
                }
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-slate-200 bg-white px-4 py-6 text-center text-sm font-medium text-slate-500">
        VyaparAI PRO - Built for 63M Kirana Stores | Parul Tech-A-Thon 2.0 | Next.js + Gemini + Laravel
      </footer>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 shadow-sm">
      <p className="text-2xl font-extrabold text-[#1E3A8A] sm:text-3xl">
        {value}
      </p>

      <p className="mt-1 text-sm font-medium text-slate-500">
        {label}
      </p>
    </div>
  );
}

function EmptyBills({
  t,
  onUpload,
}: {
  t: Copy;
  onUpload: () => void;
}) {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      <svg
        width="180"
        height="140"
        viewBox="0 0 180 140"
        fill="none"
      >
        <rect
          x="48"
          y="18"
          width="84"
          height="108"
          rx="10"
          fill="#EFF6FF"
          stroke={PRIMARY}
          strokeWidth="2"
        />

        <rect
          x="62"
          y="34"
          width="56"
          height="8"
          rx="4"
          fill="#93C5FD"
        />

        <rect
          x="62"
          y="50"
          width="40"
          height="6"
          rx="3"
          fill="#BFDBFE"
        />

        <rect
          x="62"
          y="64"
          width="48"
          height="6"
          rx="3"
          fill="#BFDBFE"
        />

        <rect
          x="62"
          y="78"
          width="36"
          height="6"
          rx="3"
          fill="#BFDBFE"
        />

        <circle
          cx="132"
          cy="108"
          r="22"
          fill={PROFIT_GREEN}
        />

        <path
          d="M124 108l6 6 12-14"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <Receipt className="mt-2 h-6 w-6 text-[#1E3A8A]" />

      <h3 className="mt-3 text-lg font-bold text-slate-800">
        {t.emptyTitle}
      </h3>

      <p className="mt-2 max-w-md text-sm text-slate-500">
        {t.emptySub}
      </p>

      <button
        type="button"
        onClick={onUpload}
        className="mt-5 rounded-xl bg-[#1E3A8A] px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-blue-900"
      >
        {t.uploadBtn}
      </button>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 py-2">
      <span className="text-slate-500">
        {label}
      </span>

      <span className="text-right font-medium">
        {value}
      </span>
    </div>
  );
}

function CountInr({
  value,
  ready,
  className,
  style,
}: {
  value: number;
  ready: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const [shown, setShown] =
    useState(0);

  const fromRef =
    useRef(0);

  useEffect(() => {
    if (!ready) return;

    const from =
      fromRef.current;

    const to = value;

    const start =
      performance.now();

    const duration = 900;

    let animationFrame = 0;

    const ease = (
      progress: number
    ) =>
      1 -
      (1 - progress) ** 3;

    const tick = (
      now: number
    ) => {
      const progress =
        Math.min(
          1,
          (now - start) /
            duration
        );

      setShown(
        Math.round(
          from +
            (to - from) *
              ease(progress)
        )
      );

      if (progress < 1) {
        animationFrame =
          requestAnimationFrame(
            tick
          );
      } else {
        fromRef.current =
          to;
      }
    };

    animationFrame =
      requestAnimationFrame(
        tick
      );

    return () =>
      cancelAnimationFrame(
        animationFrame
      );
  }, [value, ready]);

  return (
    <span
      className={className}
      style={style}
    >
      ₹
      {shown.toLocaleString(
        "en-IN"
      )}
    </span>
  );
}

function Kpi({
  title,
  value,
  icon,
  ready,
}: {
  title: string;
  value: number;
  icon: ReactNode;
  ready: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-lg">
      <div className="flex items-center justify-between text-slate-500">
        <p className="text-sm font-medium">
          {title}
        </p>

        <span className="text-[#1E3A8A]">
          {icon}
        </span>
      </div>

      <CountInr
        value={value}
        ready={ready}
        className="mt-2 block text-2xl font-extrabold text-slate-900"
      />
    </div>
  );
}