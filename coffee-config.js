/** קפה בכרם – הגדרות הזמנה ותשלום */
const COFFEE_CONFIG = {
  /** Web3Forms – מפתח ייעודי להזמנות קפה (web3forms.com) */
  web3forms: {
    apiKey: "f44eb130-d905-4a71-8b45-96102d2c3524",
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
    { id: "cappuccino", name: "קפוצ'ינו", price: 14 },
    { id: "latte", name: "לאטה", price: 16 },
    { id: "americano", name: "Americano", price: 12 },
    { id: "cold-brew", name: "קפה קר", price: 18 },
    { id: "cold-shokolate", name: "שוקו קר", price: 18 },
    { id: "hot-shokolate", name: "שוקו חם", price: 18 },
  ],
};
