/** קפה בכרם – הגדרות הזמנה ותשלום */
const COFFEE_CONFIG = {
  /** Web3Forms – מפתח ייעודי להזמנות קפה (מ-web3forms.com) */
  web3forms: {
    apiKey: "f44eb130-d905-4a71-8b45-96102d2c3524",
    subject: "הזמנת קפה חדשה – קפה בכרם",
    fromName: "קפה בכרם – הזמנה",
  },

  /** מספר לקבלת תשלום ב-Bit / Paybox (ספרות בלבד, עם קידומת 972) */
  paymentPhone: "0544853865",
  paymentPhoneDisplay: "0544853865",

  /**
   * תבניות קישור לתשלום – {amount} {phone} {note} {name}
   * אם הקישור לא פותח תשלום עם סכום, עדכנו לפי קישור שיתוף מ-Bit / Paybox.
   */
  bitPaymentUrlTemplate:
    "bit://sendMoney?phoneNumber={phone}&amount={amount}&comment={note}",
  payboxPaymentUrlTemplate:
    "paybox://send?phone={phone}&amount={amount}&text={note}",

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
