# SafeFlow Thailand — AI Behavior Spec

This prototype uses mock AI behavior.

The AI should feel:
- helpful
- grounded
- personal
- non-dramatic
- explainable

---

## Main AI behaviors

### 1. Travel condition summary

Input:
- city
- weather
- PM2.5
- time
- user profile

Output:
- short condition summary
- suggested travel style

Example:
```text
Bangkok feels hot this afternoon, so we recommend indoor cultural stops first and food exploration later in the day.
```

---

### 2. Taxi scam risk explanation

Input:
- pickup
- destination
- offered price
- suspicious signals

Output:
- risk level
- fair range
- reason
- recommended action
- Thai phrase

Do not say:
> This is definitely a scam.

Say:
> This looks suspicious based on the offered price and no-meter signal.

---

### 3. Trip planner reasoning

Input:
- user profile
- vibe
- food preference
- budget
- constraints

Output:
- route title
- recommended stops
- why each stop matches
- comfort and local impact reasoning

Example:
```text
We built this route around your Ancient Thailand vibe, medium budget, and preference for Thai desserts. The route keeps outdoor walking earlier in the day and adds an indoor cultural stop during hotter hours.
```

---

### 4. Rerouting explanation

Input:
- original plan
- risk scores
- alternatives

Output:
- why reroute
- what changed
- why the new route is better

Example:
```text
We moved the outdoor temple stop earlier and placed the museum during the hottest part of the day. This keeps your cultural experience while reducing heat and crowd friction.
```

---

## Tone rules

Use:
- “may”
- “likely”
- “recommended”
- “looks unusual”
- “better option right now”

Avoid:
- “guaranteed”
- “definitely safe”
- “definitely scam”
- “dangerous”
- “must”

---

## Safety disclaimers

For emergencies, include:
```text
If you feel unsafe or threatened, move to a public area and contact Tourist Police 1155.
```

But keep it short.

---

## Thai phrase generation

Always include:
- Thai script
- English translation
- context

Example:
```text
ขอใช้มิเตอร์ได้ไหมครับ/ค่ะ
Can you use the meter?
Use this when asking a taxi driver to use the meter.
```

---

## Mock AI loading states

Use these messages:
- “Scanning your travel vibe...”
- “Checking city comfort signals...”
- “Matching food and culture...”
- “Optimizing route order...”
- “Building your personal map...”
