export const suspiciousSignals = [
  { id: "no meter", label: "No meter", detail: "Driver avoids the meter" },
  { id: "cash only", label: "Cash only", detail: "Refuses other options" },
  { id: "pressure", label: "Pressure", detail: "Pushes you to decide fast" },
  { id: "fixed price only", label: "Fixed price only", detail: "Won't discuss range" },
  { id: "place closed", label: "Place is closed", detail: "Claims your destination is closed" },
  { id: "shopping detour", label: "Shopping detour", detail: "Suggests tours or shops" }
];

export const taxiExamples = [
  {
    pickup: "Suvarnabhumi Airport",
    destination: "Sukhumvit",
    fairRange: [320, 520] as const,
    offeredPrice: 1200,
    risk: "High",
    reasons: ["Offered price is far above fair range", "Cash only", "No meter"],
    actions: ["Use official taxi queue", "Ask for meter", "Consider Airport Rail Link"]
  },
  {
    pickup: "Siam",
    destination: "Chatuchak",
    fairRange: [120, 220] as const,
    offeredPrice: 250,
    risk: "Medium",
    reasons: ["Slightly above expected range", "Peak traffic time"],
    actions: ["Ask for meter", "Compare with ride-hailing estimate"]
  }
];

export const thaiPhrases = [
  {
    thai: "ขอใช้มิเตอร์ได้ไหมครับ/คะ",
    english: "Can you use the meter?",
    context: "Use this before starting a taxi ride."
  },
  {
    thai: "ขอใบเสร็จได้ไหมครับ/คะ",
    english: "Can I have a receipt?",
    context: "Use this if you need a record of the fare."
  },
  {
    thai: "ช่วยโทรหาตำรวจท่องเที่ยวให้หน่อยครับ/ค่ะ",
    english: "Please help me call the tourist police.",
    context: "Use this if you feel unsafe or threatened."
  }
];
