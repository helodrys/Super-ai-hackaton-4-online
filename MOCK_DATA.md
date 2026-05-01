# SafeFlow Thailand — Mock Data Guide

Use mock data only for the prototype.

Create files like:

```text
src/data/weather.ts
src/data/places.ts
src/data/taxi.ts
src/data/itineraries.ts
src/data/options.ts
```

---

## Weather mock data

```ts
export const cityConditions = [
  {
    city: "Bangkok",
    temperature: 32,
    feelsLike: 38,
    weather: "Partly cloudy",
    pm25: 42,
    airQuality: "Moderate",
    rainRisk: "Low",
    comfortScore: 76,
    summary: "Best for indoor cultural routes and late-afternoon food stops."
  },
  {
    city: "Chiang Mai",
    temperature: 30,
    feelsLike: 35,
    weather: "Hazy sun",
    pm25: 88,
    airQuality: "Unhealthy for sensitive groups",
    rainRisk: "Low",
    comfortScore: 58,
    summary: "Outdoor walking may feel uncomfortable. Consider indoor cultural stops."
  },
  {
    city: "Phuket",
    temperature: 29,
    feelsLike: 34,
    weather: "Cloudy with possible rain",
    pm25: 21,
    airQuality: "Good",
    rainRisk: "Medium",
    comfortScore: 72,
    summary: "Good for Old Town and food routes; check boat plans before leaving."
  }
];
```

---

## Taxi mock data

```ts
export const taxiExamples = [
  {
    pickup: "Suvarnabhumi Airport",
    destination: "Sukhumvit",
    fairRange: [320, 520],
    offeredPrice: 1200,
    risk: "High",
    reasons: ["Offered price is far above fair range", "Cash only", "No meter"],
    actions: ["Use official taxi queue", "Ask for meter", "Consider Airport Rail Link"]
  },
  {
    pickup: "Siam",
    destination: "Chatuchak",
    fairRange: [120, 220],
    offeredPrice: 250,
    risk: "Medium",
    reasons: ["Slightly above expected range", "Peak traffic time"],
    actions: ["Ask for meter", "Compare with ride-hailing estimate"]
  }
];
```

---

## Place mock schema

```ts
export const places = [
  {
    id: "wat-ratchanatdaram",
    name: "Wat Ratchanatdaram",
    city: "Bangkok",
    type: "Temple",
    businessSize: "medium",
    indoor: false,
    outdoor: true,
    tags: ["ancient", "culture", "photography", "temple"],
    foodTagsNearby: ["thai", "dessert", "street-food"],
    crowdLevel: "Medium",
    riskLevel: "Low",
    accessibility: "Moderate",
    priceLevel: 1,
    estimatedCost: 50,
    lat: 13.756,
    lng: 100.503,
    image: "/images/wat-ratchanatdaram.jpg",
    description: "A striking temple with a calmer atmosphere and strong historical character."
  },
  {
    id: "museum-siam",
    name: "Museum Siam",
    city: "Bangkok",
    type: "Museum",
    businessSize: "large",
    indoor: true,
    outdoor: false,
    tags: ["culture", "history", "rainy-day", "family"],
    foodTagsNearby: ["thai", "cafe"],
    crowdLevel: "Low",
    riskLevel: "Low",
    accessibility: "Good",
    priceLevel: 2,
    estimatedCost: 100,
    lat: 13.744,
    lng: 100.494,
    image: "/images/museum-siam.jpg",
    description: "A playful indoor museum for Thai culture and identity."
  },
  {
    id: "local-dessert-cafe",
    name: "Old Town Thai Dessert House",
    city: "Bangkok",
    type: "Dessert Café",
    businessSize: "small",
    indoor: true,
    outdoor: false,
    tags: ["dessert", "local", "cozy", "foodie"],
    foodTagsNearby: ["thai-dessert", "cafe"],
    crowdLevel: "Low",
    riskLevel: "Low",
    accessibility: "Good",
    priceLevel: 1,
    estimatedCost: 180,
    lat: 13.75,
    lng: 100.5,
    image: "/images/thai-dessert.jpg",
    description: "A small dessert shop with classic Thai sweets and a calm local feeling."
  }
];
```

---

## Trip planner option data

```ts
export const travelerProfiles = [
  "Solo traveler",
  "Couple",
  "Family",
  "With child",
  "With pet",
  "Elderly traveler",
  "Wheelchair / mobility support",
  "Pregnant traveler",
  "Budget traveler",
  "Luxury traveler"
];

export const travelVibes = [
  "Ancient Thailand",
  "Spiritual & Peaceful",
  "Cozy & Slow",
  "Adventure & Exploration",
  "Fun & Colorful",
  "Romantic",
  "Hidden Gems",
  "Nature Escape",
  "Foodie Journey",
  "Cultural Deep Dive",
  "Luxury & Relaxed",
  "Local & Authentic",
  "Photo Spot Hunt"
];

export const foodPreferences = [
  "Thai",
  "Thai fusion",
  "Thai-Japanese",
  "Thai-Chinese",
  "Thai-Isan",
  "Northern Thai",
  "Southern Thai",
  "Street food",
  "Dessert",
  "Café & bakery",
  "Seafood",
  "Halal",
  "Vegan",
  "Vegetarian"
];
```

---

## Itinerary mock data

```ts
export const itinerary = {
  title: "Your Ancient Thailand Escape",
  city: "Bangkok",
  duration: "5 hours",
  estimatedBudget: 1250,
  summary: "A calm cultural route designed around temples, Thai desserts, low walking load, and a medium budget.",
  scores: {
    crowdComfort: 82,
    foodMatch: 91,
    localAuthenticity: 88,
    accessibilityFit: 76,
    weatherSuitability: 80,
    budgetFit: 86
  },
  stops: [
    {
      time: "10:00",
      name: "Wat Ratchanatdaram",
      type: "Temple",
      reason: "Matches your Ancient Thailand vibe with less crowd pressure than major tourist sites.",
      estimatedCost: 50,
      tags: ["ancient", "culture", "photo"],
      comfortNote: "Outdoor but manageable in the morning."
    },
    {
      time: "11:30",
      name: "Old Town Thai Lunch Shop",
      type: "Restaurant",
      reason: "Local Thai food within your budget and near the first stop.",
      estimatedCost: 280,
      tags: ["thai", "local", "lunch"],
      comfortNote: "Indoor seating available."
    },
    {
      time: "13:00",
      name: "Museum Siam",
      type: "Museum",
      reason: "Indoor cultural stop that keeps the route comfortable during hotter hours.",
      estimatedCost: 100,
      tags: ["indoor", "history", "family-friendly"],
      comfortNote: "Good rainy-day and heat-friendly choice."
    },
    {
      time: "15:00",
      name: "Old Town Thai Dessert House",
      type: "Dessert Café",
      reason: "A small local dessert shop that matches your food preference and supports local business.",
      estimatedCost: 180,
      tags: ["dessert", "local", "cozy"],
      comfortNote: "Low walking load."
    }
  ]
};
```

---

## Risk labels

Use these consistently:

```ts
export const riskLabels = {
  low: {
    label: "Low",
    color: "green",
    meaning: "Comfortable right now"
  },
  medium: {
    label: "Medium",
    color: "yellow",
    meaning: "Go with awareness"
  },
  high: {
    label: "High",
    color: "coral",
    meaning: "Reroute or delay recommended"
  }
};
```
