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

import {
  ArrowDownRight,
  ArrowUpRight,
  Download,
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
const LANG_KEY = "vyapar_lang";

const PRIMARY = "#1E3A8A";
const PROFIT_GREEN = "#10B981";

const SHOPS = [
  "Patel Kirana Bayad",
  "Shree Medical Mehsana",
  "Gujarat Traders Surat",
] as const;

const CATEGORIES = ["Sales", "Purchase", "Kharch"] as const;

const PIE_COLORS: Record<Category, string> = {
  Sales: "#10B981",
  Purchase: "#1E3A8A",
  Kharch: "#F59E0B",
};

const PATEL_BILL: Extracted = {
  shopName: "Patel Kirana & General Store Bayad",
  date: "2026-08-22",
  totalAmount: 1005,
  items: [
    "Chawal 5kg",
    "Tel 1L",
    "Khand 2kg",
    "Chai Patti 500g",
    "Biscuit",
  ],
  category: "Sales",
  confidence: 98,
};

type Lang = "EN" | "HI" | "GU";

type Category = (typeof CATEGORIES)[number];

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

const en = {
  tagline: "Bill Parser & Vyapar Intelligence",
  cta: "Start for Free",
  heroTitle: "Business accounts, with AI",
  heroSub:
    "Upload a bill photo — AI instantly shows profit in Gujarati, Hindi and English",
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
    "Take a photo of a kirana / medical bill and drop it above. AI will extract shop, amount and category.",
  noResults: "No bills match this search",
  noImage: "Upload a bill to see preview",
  catSales: "Sales",
  catPurchase: "Purchase",
  catKharch: "Expense",
  speakTpl: "Your total profit is {x} rupees",
  waTpl:
    "My profit report from VyaparAI PRO:\nSales: {s}\nPurchase: {p}\nExpense: {k}\nNet profit: {n}",
  insightKharch: "Expense is {x}% of mix — bought {n} times from {shop}",
  insightDay: "Most sales happen on {day}",
  insightUp: "Profit is {p}% higher than last month",
  insightDown: "Profit is {p}% lower than last month",
};

type Copy = typeof en;

const hi: Copy = {
  tagline: "बिल पार्सर और व्यापार इंटेलिजेंस",
  cta: "फ्री में शुरू करें",
  heroTitle: "व्यापार का हिसाब, एआई के साथ",
  heroSub:
    "बिल का फोटो अपलोड करें, एआई तुरंत मुनाफा बताएगा — गुजराती, हिंदी और अंग्रेज़ी में",
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
  speak: "🔊 Profit Suno",
  whatsapp: "WhatsApp Par Bhejo",
  pdf: "Download PDF Report",
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
    "किराना या मेडिकल बिल की फोटो लें और ऊपर छोड़ें। एआई दुकान, राशि और श्रेणी निकाल देगा।",
  noResults: "इस खोज से कोई बिल नहीं मिला",
  noImage: "पूर्वावलोकन के लिए बिल अपलोड करें",
  catSales: "बिक्री",
  catPurchase: "खरीद",
  catKharch: "खर्च",
  speakTpl: "आपका कुल नफा {x} रुपये है",
  waTpl:
    "VyaparAI PRO से मेरी मुनाफा रिपोर्ट:\nबिक्री: {s}\nखरीद: {p}\nखर्च: {k}\nशुद्ध लाभ: {n}",
  insightKharch: "खर्च {x}% हिस्सा है — {shop} से {n} बार खरीदी",
  insightDay: "{day} को सबसे ज्यादा बिक्री होती है",
  insightUp: "लाभ पिछले महीने से {p}% ज्यादा है",
  insightDown: "लाभ पिछले महीने से {p}% कम है",
};

const gu: Copy = {
  tagline: "બિલ પાર્સર અને વ્યાપાર ઇન્ટેલિજન્સ",
  cta: "ફ્રીમાં શરૂ કરો",
  heroTitle: "વ્યાપારનો હિસાબ, એઆઈ સાથે",
  heroSub:
    "બિલનો ફોટો અપલોડ કરો, એઆઈ તરત નફો બતાવશે — ગુજરાતી, હિન્દી અને અંગ્રેજીમાં",
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
  speak: "🔊 Profit Suno",
  whatsapp: "WhatsApp Par Bhejo",
  pdf: "Download PDF Report",
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
    "કિરાણા અથવા મેડિકલ બિલનો ફોટો લો અને ઉપર મૂકો. એઆઈ દુકાન, રકમ અને શ્રેણી કાઢશે.",
  noResults: "આ શોધ સાથે કોઈ બિલ મળ્યું નહીં",
  noImage: "પૂર્વાવલોકન માટે બિલ અપલોડ કરો",
  catSales: "વેચાણ",
  catPurchase: "ખરીદી",
  catKharch: "ખર્ચ",
  speakTpl: "તમારો કુલ નફો {x} રૂપિયા છે",
  waTpl:
    "VyaparAI PROથી મારી નફા રિપોર્ટ:\nવેચાણ: {s}\nખરીદી: {p}\nખર્ચ: {k}\nચોખ્ખો નફો: {n}",
  insightKharch: "ખર્ચ {x}% હિસ્સો છે — {shop} પાસેથી {n} વાર ખરીદી",
  insightDay: "{day}એ સૌથી વધુ વેચાણ થાય છે",
  insightUp: "નફો પાછલા મહિના કરતાં {p}% વધુ છે",
  insightDown: "નફો પાછલા મહિના કરતાં {p}% ઓછો છે",
};

const copy: Record<Lang, Copy> = {
  EN: en,
  HI: hi,
  GU: gu,
};

function catLabel(t: Copy, cat: Category) {
  if (cat === "Sales") return t.catSales;
  if (cat === "Purchase") return t.catPurchase;
  return t.catKharch;
}

function inr(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function isoMonthsAgo(months: number, day = 8) {
  const d = new Date();
  d.setMonth(d.getMonth() - months, day);
  return d.toISOString().slice(0, 10);
}

// Demo helper - currently always returns true.
function isPatelKiranaBill(_file: File): boolean {
  return true;
}

// Demo OCR - returns the fixed Patel bill.
function mockOCR(_file: File): Extracted {
  return {
    ...PATEL_BILL,
    date: todayISO(),
  };
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
      items: ["Rice 5kg", "Oil 1L", "Sugar 2kg"],
      category: "Purchase",
      confidence: 97,
    },
    {
      id: "sample-3",
      shopName: "Gujarat Traders Surat",
      date: isoMonthsAgo(0, 20),
      totalAmount: 1650,
      items: ["Rice 5kg", "Oil 1L", "Sugar 2kg"],
      category: "Kharch",
      confidence: 96,
    },
  ];
}

function persist(bills: Bill[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bills));
}

function sumBy(bills: Bill[], cat: Category) {
  return bills
    .filter((b) => b.category === cat)
    .reduce((s, b) => s + b.totalAmount, 0);
}

function monthKey(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function last6MonthKeys(lang: Lang) {
  const locale =
    lang === "HI" ? "hi-IN" : lang === "GU" ? "gu-IN" : "en-IN";

  const keys: { key: string; label: string }[] = [];

  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);

    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}`;

    keys.push({
      key,
      label: d.toLocaleString(locale, {
        month: "short",
      }),
    });
  }

  return keys;
}

function weekdayName(dateStr: string, lang: Lang) {
  const locale =
    lang === "HI" ? "hi-IN" : lang === "GU" ? "gu-IN" : "en-IN";

  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(locale, {
    weekday: "long",
  });
}

function fillTpl(
  tpl: string,
  vars: Record<string, string | number>
) {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.split(`{${k}}`).join(String(v)),
    tpl
  );
}

function downloadSampleGujaratiBill() {
  const canvas = document.createElement("canvas");

  canvas.width = 720;
  canvas.height = 1020;

  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  ctx.fillStyle = "#fffaf3";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#1E3A8A";
  ctx.lineWidth = 8;
  ctx.strokeRect(
    24,
    24,
    canvas.width - 48,
    canvas.height - 48
  );

  ctx.fillStyle = "#1E3A8A";
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

  const rows: [string, string, string, string][] = [
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
    [
      "ખાંડ 2 કિ.ગ્રા.",
      "1",
      "₹88",
      "₹88",
    ],
    [
      "તુવેર દાળ 1 કિ.ગ્રા.",
      "1",
      "₹165",
      "₹165",
    ],
    [
      "મીઠું 1 કિ.ગ્રા.",
      "1",
      "₹22",
      "₹22",
    ],
  ];

  ctx.font =
    "18px Nirmala UI, Shruti, sans-serif";

  rows.forEach((row, i) => {
    const y = 330 + i * 48;

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

  ctx.fillStyle = "#1E3A8A";

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

  // FIX:
  // toBlob() belongs to HTMLCanvasElement,
  // not CanvasRenderingContext2D.
  canvas.toBlob(
    (blob: Blob | null) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = "sample-gujarati-bill.png";

      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    },
    "image/png"
  );
}

export default function Home() {
  const [lang, setLang] = useState<Lang>("EN");

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
    try {
      const savedLang =
        localStorage.getItem(LANG_KEY);

      if (
        savedLang === "EN" ||
        savedLang === "HI" ||
        savedLang === "GU"
      ) {
        setLang(savedLang);
      }

      const raw =
        localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        const seed = sampleBills();

        persist(seed);
        setBills(seed);
      } else {
        const parsed =
          JSON.parse(raw) as Bill[];

        setBills(
          Array.isArray(parsed)
            ? parsed
            : sampleBills()
        );
      }
    } catch {
      const seed = sampleBills();

      persist(seed);
      setBills(seed);
    }

    setHydrated(true);
  }, []);

  const changeLang = (code: Lang) => {
    setLang(code);
    localStorage.setItem(LANG_KEY, code);
  };

  const setAndSave = useCallback(
    (next: Bill[]) => {
      setBills(next);
      persist(next);
    },
    []
  );

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
    sales - (purchase + kharch);

  const profitUp = profit >= 0;

  const monthlyData = useMemo(() => {
    return last6MonthKeys(lang).map(
      ({ key, label }) => {
        const monthBills =
          bills.filter(
            (b) => monthKey(b.date) === key
          );

        const s = sumBy(
          monthBills,
          "Sales"
        );

        const p =
          sumBy(monthBills, "Purchase") +
          sumBy(monthBills, "Kharch");

        return {
          month: label,
          profit: s - p,
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
          value: sales,
        },
        {
          name: t.catPurchase,
          key: "Purchase" as Category,
          value: purchase,
        },
        {
          name: t.catKharch,
          key: "Kharch" as Category,
          value: kharch,
        },
      ].filter((d) => d.value > 0),
    [sales, purchase, kharch, t]
  );

  const vendors = useMemo(() => {
    const map = new Map<
      string,
      {
        total: number;
        count: number;
      }
    >();

    for (const b of bills) {
      const cur =
        map.get(b.shopName) ?? {
          total: 0,
          count: 0,
        };

      cur.total += b.totalAmount;
      cur.count += 1;

      map.set(b.shopName, cur);
    }

    return [...map.entries()]
      .map(([name, v]) => ({
        name,
        ...v,
      }))
      .sort(
        (a, b) => b.total - a.total
      )
      .slice(0, 5);
  }, [bills]);

  const insights = useMemo(() => {
    const kharchBills = bills.filter(
      (b) => b.category === "Kharch"
    );

    const topKharch = vendors[0];

    const mix =
      sales + purchase + kharch;

    const kharchShare =
      mix > 0
        ? Math.round((kharch / mix) * 100)
        : 32;

    const salesByDay =
      new Map<string, number>();

    for (
      const b of bills.filter(
        (x) => x.category === "Sales"
      )
    ) {
      const day = weekdayName(
        b.date,
        lang
      );

      salesByDay.set(
        day,
        (salesByDay.get(day) ?? 0) +
          b.totalAmount
      );
    }

    let bestDay =
      weekdayName(todayISO(), lang);

    let bestVal = -1;

    for (const [day, val] of salesByDay) {
      if (val > bestVal) {
        bestVal = val;
        bestDay = day;
      }
    }

    const now = new Date();

    const thisKey = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;

    const prev = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );

    const prevKey = `${prev.getFullYear()}-${String(
      prev.getMonth() + 1
    ).padStart(2, "0")}`;

    const monthProfit = (
      key: string
    ) => {
      const mb = bills.filter(
        (b) => monthKey(b.date) === key
      );

      return (
        sumBy(mb, "Sales") -
        (sumBy(mb, "Purchase") +
          sumBy(mb, "Kharch"))
      );
    };

    const thisProfit =
      monthProfit(thisKey);

    const lastProfit =
      monthProfit(prevKey);

    let pct = 18;

    if (lastProfit !== 0) {
      pct = Math.round(
        ((thisProfit - lastProfit) /
          Math.abs(lastProfit)) *
          100
      );
    }

    const shop =
      topKharch?.name ??
      "Patel Traders";

    const shopHits =
      kharchBills.filter(
        (b) => b.shopName === shop
      ).length || 3;

    return [
      fillTpl(t.insightKharch, {
        x: kharchShare,
        n: shopHits,
        shop,
      }),

      fillTpl(t.insightDay, {
        day: bestDay,
      }),

      fillTpl(
        pct >= 0
          ? t.insightUp
          : t.insightDown,
        {
          p: Math.abs(pct),
        }
      ),
    ];
  }, [
    bills,
    vendors,
    sales,
    purchase,
    kharch,
    lang,
    t,
  ]);

  const filtered = useMemo(() => {
    const q = query
      .trim()
      .toLowerCase();

    return [...bills]
      .sort(
        (a, b) =>
          b.date.localeCompare(a.date) ||
          b.id.localeCompare(a.id)
      )
      .filter(
        (b) =>
          filterCat === "All"
            ? true
            : b.category === filterCat
      )
      .filter((b) => {
        if (!q) return true;

        const hay = [
          b.shopName,
          b.date,
          String(b.totalAmount),
          inr(b.totalAmount),
          b.category,
          catLabel(t, b.category),
          b.items.join(" "),
        ]
          .join(" ")
          .toLowerCase();

        return hay.includes(q);
      })
      .slice(0, 10);
  }, [
    bills,
    query,
    filterCat,
    t,
  ]);

  const showToast = (msg: string) => {
    setToast(msg);

    window.setTimeout(
      () => setToast(""),
      2200
    );
  };

  const processFile = async (
    file: File
  ) => {
    setBusy(true);
    setExtracted(null);

    const isImage =
      file.type.startsWith("image/");

    let dataUrl: string | undefined;

    if (isImage) {
      dataUrl =
        await new Promise<string>(
          (resolve, reject) => {
            const reader =
              new FileReader();

            reader.onload = () =>
              resolve(
                String(
                  reader.result
                )
              );

            reader.onerror = () =>
              reject(
                new Error(
                  "read failed"
                )
              );

            reader.readAsDataURL(file);
          }
        );

      setPreview(dataUrl);
    } else {
      setPreview(null);
    }

    await new Promise((r) =>
      setTimeout(r, 700)
    );

    const data = mockOCR(file);

    setExtracted({
      ...data,
      imageDataUrl: dataUrl,
    });

    setBusy(false);
  };

  const onFiles = (
    files: FileList | null
  ) => {
    const file = files?.[0];

    if (!file) return;

    void processFile(file);
  };

  const saveBill = () => {
    if (!extracted) return;

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

    setAndSave([
      bill,
      ...bills,
    ]);

    showToast(t.saved);

    setExtracted(null);
    setPreview(null);
  };

  const deleteBill = (
    id: string
  ) => {
    setAndSave(
      bills.filter(
        (b) => b.id !== id
      )
    );

    if (editing?.id === id) {
      setEditing(null);
    }
  };

  const openEdit = (
    bill: Bill
  ) => {
    setEditing(bill);
    setEditCat(bill.category);
  };

  const saveEdit = () => {
    if (!editing) return;

    setAndSave(
      bills.map((b) =>
        b.id === editing.id
          ? {
              ...b,
              category: editCat,
            }
          : b
      )
    );

    setEditing(null);

    showToast(t.updated);
  };

  const speakProfit = () => {
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

    const u =
      new SpeechSynthesisUtterance(
        text
      );

    u.lang =
      lang === "GU"
        ? "gu-IN"
        : lang === "HI"
        ? "hi-IN"
        : "en-IN";

    window.speechSynthesis.speak(u);
  };

  const sendWhatsApp = () => {
    const text = fillTpl(
      t.waTpl,
      {
        s: inr(sales),
        p: inr(purchase),
        k: inr(kharch),
        n: inr(profit),
      }
    );

    const url = `https://wa.me/?text=${encodeURIComponent(
      text
    )}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const downloadPdf = () => {
    const doc = new jsPDF();

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
      `${new Date().toLocaleString(
        "en-IN"
      )}`,
      14,
      38
    );

    let y = 52;

    doc.setFontSize(12);

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

    doc.setLineWidth(0.3);

    doc.line(
      14,
      y,
      196,
      y
    );

    y += 8;

    doc.setFontSize(10);

    for (
      const b of bills.slice(0, 20)
    ) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      doc.text(
        b.shopName.slice(0, 32),
        14,
        y
      );

      doc.text(
        b.date,
        90,
        y
      );

      doc.text(
        catLabel(
          t,
          b.category
        ),
        120,
        y
      );

      doc.text(
        inr(b.totalAmount),
        160,
        y
      );

      y += 8;
    }

    y += 6;

    doc.setFontSize(11);

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
    cat: Category
  ) => {
    const map: Record<
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
        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${map[cat]}`}
      >
        {catLabel(t, cat)}
      </span>
    );
  };

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
            <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold sm:text-sm">
              {(
                ["EN", "HI", "GU"] as const
              ).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() =>
                    changeLang(code)
                  }
                  className={`px-2.5 py-1.5 sm:px-3 ${
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
              className="rounded-xl bg-[#1E3A8A] px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-900/20 hover:bg-blue-900 sm:px-4 sm:text-sm"
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

          <h1 className="max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
            {t.heroTitle}
          </h1>

          <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
            {t.heroSub}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              {
                label: t.billsParsed,
                value: "1250+",
              },
              {
                label: t.profitTracked,
                value: "₹2.5L+",
              },
              {
                label: t.timeSaved,
                value: "150hrs+",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-5 shadow-sm"
              >
                <p className="text-2xl font-extrabold text-[#1E3A8A] sm:text-3xl">
                  {s.value}
                </p>

                <p className="mt-1 text-sm font-medium text-slate-500">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="upload"
          className="scroll-mt-24"
        >
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() =>
              setDragOver(false)
            }
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              onFiles(
                e.dataTransfer.files
              );
            }}
            className={`rounded-3xl border-2 border-dashed bg-white p-8 text-center shadow-lg transition ${
              dragOver
                ? "border-[#1E3A8A] bg-blue-50"
                : "border-slate-200"
            }`}
          >
            <Upload className="mx-auto h-10 w-10 text-[#1E3A8A]" />

            <h2 className="mt-3 text-lg font-bold sm:text-xl">
              {t.uploadTitle}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {t.uploadHint}
            </p>

            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf,application/pdf"
              className="hidden"
              onChange={(e) => {
                onFiles(e.target.files);
                e.target.value = "";
              }}
            />

            <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() =>
                  fileRef.current?.click()
                }
                className="rounded-xl bg-[#1E3A8A] px-6 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-blue-900"
              >
                {t.uploadBtn}
              </button>

              <button
                type="button"
                onClick={
                  downloadSampleGujaratiBill
                }
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#1E3A8A] shadow-sm hover:bg-slate-50"
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

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl bg-white p-5 shadow-lg">
              <h3 className="mb-3 font-semibold text-slate-800">
                {t.preview}
              </h3>

              {preview ? (
                <img
                  src={preview}
                  alt=""
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
                    value={extracted.date}
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
                    label={t.confidence}
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
          <h2 className="mb-4 text-xl font-bold">
            {t.dashboard}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi
              title={t.totalSales}
              value={sales}
              icon={
                <IndianRupee className="h-5 w-5" />
              }
              ready={hydrated}
            />

            <Kpi
              title={t.totalPurchase}
              value={purchase}
              icon={
                <ShoppingCart className="h-5 w-5" />
              }
              ready={hydrated}
            />

            <Kpi
              title={t.totalKharch}
              value={kharch}
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
                  value={profit}
                  ready={hydrated}
                  className="text-2xl font-extrabold"
                  style={{
                    color: profitUp
                      ? PROFIT_GREEN
                      : "#EF4444",
                  }}
                />

                {profitUp ? (
                  <ArrowUpRight
                    className="h-6 w-6"
                    style={{
                      color: PROFIT_GREEN,
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
                    <BarChart data={monthlyData}>
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
                        formatter={(v) =>
                          inr(
                            Number(
                              v ?? 0
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
                  pieData.length > 0 && (
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        >
                          {pieData.map(
                            (d) => (
                              <Cell
                                key={d.key}
                                fill={
                                  PIE_COLORS[
                                    d.key
                                  ]
                                }
                              />
                            )
                          )}
                        </Pie>

                        <Tooltip
                          formatter={(v) =>
                            inr(
                              Number(
                                v ?? 0
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

            {vendors.length === 0 ? (
              <p className="text-sm text-slate-400">
                {t.noVendors}
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {vendors.map(
                  (v, i) => (
                    <li
                      key={v.name}
                      className="flex items-center justify-between py-3"
                    >
                      <div>
                        <p className="font-medium">
                          {i + 1}.{" "}
                          {v.name}
                        </p>

                        <p className="text-xs text-slate-500">
                          {v.count}{" "}
                          {t.billsCount}
                        </p>
                      </div>

                      <p className="font-semibold text-[#1E3A8A]">
                        {inr(v.total)}
                      </p>
                    </li>
                  )
                )}
              </ul>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-6 shadow-lg">
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
            onClick={speakProfit}
            className="flex-1 rounded-xl bg-[#1E3A8A] px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-blue-900"
          >
            {t.speak}
          </button>

          <button
            type="button"
            onClick={sendWhatsApp}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-green-600"
          >
            <MessageCircle className="h-4 w-4" />
            {t.whatsapp}
          </button>

          <button
            type="button"
            onClick={downloadPdf}
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
                  onChange={(e) =>
                    setQuery(
                      e.target.value
                    )
                  }
                  placeholder={t.search}
                  className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#1E3A8A]"
                />
              </div>

              <select
                value={filterCat}
                onChange={(e) =>
                  setFilterCat(
                    e.target.value as
                      | Category
                      | "All"
                  )
                }
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1E3A8A]"
              >
                <option value="All">
                  {t.all}
                </option>

                {CATEGORIES.map(
                  (c) => (
                    <option
                      key={c}
                      value={c}
                    >
                      {catLabel(
                        t,
                        c
                      )}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          {bills.length === 0 ? (
            <EmptyBills
              t={t}
              onUpload={() =>
                fileRef.current?.click()
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
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
                        colSpan={5}
                        className="py-8 text-center text-slate-400"
                      >
                        {t.noResults}
                      </td>
                    </tr>
                  )}

                  {filtered.map(
                    (b) => (
                      <tr
                        key={b.id}
                        className="border-b border-slate-50"
                      >
                        <td className="py-3">
                          {b.date}
                        </td>

                        <td className="py-3 font-medium">
                          {b.shopName}
                        </td>

                        <td className="py-3">
                          {inr(
                            b.totalAmount
                          )}
                        </td>

                        <td className="py-3">
                          {badge(
                            b.category
                          )}
                        </td>

                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                openEdit(b)
                              }
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[#1E3A8A] hover:bg-blue-50"
                            >
                              <Pencil className="h-4 w-4" />
                              {t.edit}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deleteBill(
                                  b.id
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              {t.delete}
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
                  {editing.shopName}
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
                value={editing.date}
              />

              <Row
                label={t.amount}
                value={inr(
                  editing.totalAmount
                )}
              />

              <label className="block">
                <span className="mb-1.5 block text-slate-500">
                  {t.category}
                </span>

                <select
                  value={editCat}
                  onChange={(e) =>
                    setEditCat(
                      e.target
                        .value as Category
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-[#1E3A8A]"
                >
                  {CATEGORIES.map(
                    (c) => (
                      <option
                        key={c}
                        value={c}
                      >
                        {catLabel(
                          t,
                          c
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
                onClick={saveEdit}
                className="flex-1 rounded-xl bg-[#1E3A8A] px-4 py-2.5 font-semibold text-white hover:bg-blue-900"
              >
                {t.saveChanges}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
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
          stroke="#1E3A8A"
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
          fill="#10B981"
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

    const dur = 900;

    let raf = 0;

    const ease = (p: number) =>
      1 - (1 - p) ** 3;

    const tick = (
      now: number
    ) => {
      const p = Math.min(
        1,
        (now - start) / dur
      );

      setShown(
        Math.round(
          from +
            (to - from) *
              ease(p)
        )
      );

      if (p < 1) {
        raf =
          requestAnimationFrame(
            tick
          );
      } else {
        fromRef.current = to;
      }
    };

    raf =
      requestAnimationFrame(
        tick
      );

    return () =>
      cancelAnimationFrame(
        raf
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