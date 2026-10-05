import { validateTx, type TxInput } from "@/lib/types";

const CATEGORY_KEYWORDS: [RegExp, TxInput["category"]][] = [
  [/grocer|supermarket|market|trader joe|whole foods|walmart|costco|aldi/i, "groceries"],
  [/electric|water|internet|wifi|gas bill|utilit|phone bill|power|rent/i, "utilities"],
  [/loan|mortgage|credit card|debt|installment|student/i, "debts"],
  [/subscription|netflix|spotify|youtube premium|disney|icloud|prime video/i, "subscriptions"],
  [/coffee|dinner|lunch|movie|game|restaurant|bar\b|concert|shopping|cinema|dining/i, "leisure"],
];

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Offline fallback used when no Gemini key is configured. */
export function heuristicParse(text: string, today: string) {
  const amountMatch = /(\d[\d,]*(?:\.\d+)?)/.exec(text);
  const isIncome = /\b(received|earned|salary|paycheck|got paid|deposit|income|payout)\b/i.test(text);
  const isSavings = !isIncome && /\b(sav(e|ed|ing|ings)|set aside|put aside|stash(ed)?)\b/i.test(text);
  const type = isIncome ? "income" : isSavings ? "savings" : "expense";
  const category = isSavings
    ? "savings"
    : isIncome
    ? /salary|paycheck|got paid/i.test(text) ? "salary" : "other"
    : (CATEGORY_KEYWORDS.find(([re]) => re.test(text))?.[1] ?? "other");

  let occurred_on = today;
  if (/yesterday/i.test(text)) {
    const [y, m, d] = today.split("-").map(Number);
    occurred_on = ymd(new Date(y, m - 1, d - 1));
  }

  const place = /\b(?:at|from|to)\s+([A-Za-z0-9&'. -]{2,40}?)(?:\s+(?:for|via|on|with|using)\b|[.,]|$)/i.exec(text);
  const description = place?.[1]?.trim() ?? "";

  return validateTx({
    type,
    amount: amountMatch ? Number(amountMatch[1].replace(/,/g, "")) : NaN,
    category,
    description,
    occurred_on,
    source: "voice",
  });
}

