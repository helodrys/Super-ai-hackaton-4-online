# SafeFlow Thailand — UX Flows

## Core user promise

The user should quickly understand:

> “I tell the app my travel plan. It tells me if the plan feels good right now. If not, it gives me a better plan.”

---

# Flow 1 — Dashboard

## User arrives

The user sees:
- greeting
- current city
- weather
- feels-like temperature
- PM2.5
- travel comfort score
- action buttons

## Dashboard user questions

The dashboard should answer:

- How does my city feel right now?
- Is today good for outdoor travel?
- Should I check a taxi price?
- Should I plan a personalized route?
- What kind of travel mood can I choose?

## Main CTA paths

- Taxi issue → Taxi Scam Checker
- Want a plan → Trip Planner
- Want quick insight → condition widgets

---

# Flow 2 — Taxi Scam Checker

## User story

A tourist is at an airport, hotel, tourist spot, or street. A driver offers a price. The tourist is not sure if it is fair.

## Steps

1. User opens Taxi Scam Checker
2. Enters pickup
3. Enters destination
4. Enters offered price
5. Selects suspicious signals:
   - no meter
   - cash only
   - fixed price only
   - pressure
   - driver says place is closed
   - suggested shopping/tour detour
6. App shows:
   - estimated fair range
   - offered price comparison
   - risk level
   - explanation
   - recommended action
   - Thai phrase

## Result copy example

```text
Risk: High

The offered price looks much higher than the mock fair range for this route.
The “cash only” and “no meter” signals increase risk.

Recommended action:
Do not accept immediately. Use an official taxi queue, ride-hailing, Airport Rail Link, BTS/MRT, or hotel-arranged transport.
```

## Thai phrase examples

```text
ขอใช้มิเตอร์ได้ไหมครับ/ค่ะ
Can you use the meter?

ขอใบเสร็จได้ไหมครับ/ค่ะ
Can I have a receipt?

ช่วยโทรหาตำรวจท่องเที่ยวให้หน่อยครับ/ค่ะ
Please help me call the tourist police.
```

---

# Flow 3 — Trip Planner

## User story

A tourist wants a travel plan that matches their identity, needs, mood, food preferences, budget, and constraints.

## Planner stages

### Step 1 — Traveler profile

Collect:
- solo
- couple
- family
- with child
- with pet
- elderly
- wheelchair / mobility support
- visually impaired
- hearing impaired
- pregnant
- budget traveler
- luxury traveler

### Step 2 — Needs and food constraints

Collect:
- seafood allergy
- nut allergy
- halal
- vegan
- vegetarian
- gluten-free
- no spicy
- kid-friendly

### Step 3 — Travel vibe

Collect emotional intent:
- Ancient Thailand
- Spiritual & Peaceful
- Cozy & Slow
- Adventure & Exploration
- Fun & Colorful
- Romantic
- Hidden Gems
- Nature Escape
- Foodie Journey
- Cultural Deep Dive
- Luxury & Relaxed
- Local & Authentic
- Photo Spot Hunt

### Step 4 — Place preferences

Collect:
- temples
- museums
- markets
- cafés
- shopping
- riverside
- old town
- craft workshops
- street food
- cultural landmarks
- indoor places
- outdoor places
- nightlife
- family activities

### Step 5 — Food preferences

Collect:
- Thai
- Thai fusion
- Thai-Japanese
- Thai-Chinese
- Thai-Isan
- Northern Thai
- Southern Thai
- street food
- dessert
- café & bakery
- seafood
- halal
- vegan
- vegetarian

### Step 6 — Budget and trip constraints

Collect:
- budget tier
- duration
- preferred time
- transport style
- avoid crowded places
- avoid outdoor heat
- avoid high walking load
- avoid tourist traps
- avoid expensive places

### Step 7 — Free prompt

Allow:
- custom text
- checkbox: “Use only selected options”

---

# Flow 4 — Itinerary Result

## User story

The user receives a beautiful plan that feels made for them.

## Result should include

- route title
- short AI summary
- large map
- numbered stops
- itinerary timeline
- estimated cost
- travel time
- walking load
- food match score
- accessibility score
- local authenticity score
- crowd comfort score
- weather suitability score
- explanation panel
- alternative route tabs

## Result example

Title:
> Your Ancient Thailand Escape

Summary:
> A calm cultural route designed around temples, Thai desserts, low walking load, and a medium budget.

Stops:
1. Wat Ratchanatdaram
2. Old Town lunch shop
3. Museum Siam
4. Thai dessert café
5. Riverside sunset walk

Smart summary:
- Budget: 1,250 THB
- Duration: 5 hours
- Crowd comfort: 82/100
- Local authenticity: 88/100
- Walking load: Medium
- Accessibility fit: Good

---

# Flow 5 — Rerouting logic

If a plan has high risk/friction:

1. Explain why
2. Keep the user's vibe
3. Replace risky places with safer alternatives
4. Preserve food preference and budget
5. Increase local business support
6. Show before/after score

Example:

Original:
> Grand Palace at 11:30, outdoor food market, taxi transport

Issue:
> peak time + heat + tourist friction

Reroute:
> Museum Siam first, lunch nearby, Grand Palace later, BTS/MRT transport

Before/After:
- Friction: 78 → 42
- Local support: 35 → 74
- Comfort: 51 → 86
