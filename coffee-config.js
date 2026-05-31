/** קפה בכרם – הגדרות הזמנה ותשלום */
const COFFEE_CONFIG = {
  /** Web3Forms – מפתח ייעודי להזמנות קפה (web3forms.com) */
  web3forms: {
    apiKey: "7649cac2-ce6b-4a86-93cc-f05b35322b76",
    subject: "הזמנת קפה חדשה – קפה בכרם",
    fromName: "קפה בכרם – הזמנה",
  },

  paymentPhone: "0544853865",
  paymentPhoneDisplay: "0544853865",

  /** קישורי תשלום קבועים מ-Bit / Paybox (כמו בטופס) */
  bitPaymentLink:
    "https://www.bitpay.co.il/app/me/213B64FE-AD31-B916-D730-1E0796130DB8FAA2",
  payboxPaymentLink: "https://links.payboxapp.com/ynN9DuOkoWb",

  menu: [
    { id: "espresso", name: "אספרסו", price: 10 },
    { id: "cappuccino", name: "קפוצ'ינו", price: 13 },
    { id: "latte", name: "קפוצ׳ינו גדול - ךןןדא שיש לפני הזמנה!", price: 15 },
    { id: "americano", name: "תפוזים", price: 13 },
    { id: "cold-brew", name: "קפה קר", price: 18 },
    { id: "cold-shokolate", name: "שוקו קר", price: 18 },
    { id: "hot-shokolate", name: "תה", price: 10 },
  ],
};
