# Full Prompt for Codex / Cursor / Claude

You are a senior product designer, senior frontend engineer, and creative director.

Build a premium frontend mockup for an AI tourism product called **SafeFlow Thailand**.

## Product concept

SafeFlow Thailand helps tourists in Thailand decide whether to go, delay, or reroute by checking travel conditions, weather, PM2.5, taxi scam risk, personal preferences, accessibility needs, food preferences, and budget.

This is a **mockup-first prototype** using mock data only.

## Key pages

1. Dashboard
2. Taxi Scam Checker
3. Trip Planner
4. Itinerary Result

## Visual style

This must look like a premium travel consumer product, not a generic SaaS dashboard.

Use:
- bright travel colors
- teal/ocean blue
- coral/sunset orange
- gold accents
- soft cream background
- subtle purple AI accents
- rich cards
- animated map visuals
- polished transitions
- hover glows
- premium typography
- beautiful spacing
- delightful form interactions

Avoid:
- boring white SaaS layout
- generic AI chatbot UI
- default admin dashboard
- ugly forms
- low-effort template look

## Dashboard requirements

Include:
- personalized greeting
- current city
- weather
- feels-like temperature
- PM2.5
- air quality
- travel comfort score
- short recommendation summary
- CTA cards for Taxi Scam Checker and Trip Planner
- mood chips
- stylized mini map

## Taxi Scam Checker requirements

Fields:
- pickup location
- destination
- offered price
- transport type
- suspicious behavior checkboxes:
  - no meter
  - cash only
  - pressure
  - fixed price only
  - driver says place is closed
  - suggested shopping/tour detour

Result:
- estimated fair price range
- offered price
- risk level
- reason
- recommended actions
- Thai phrase helper

## Trip Planner requirements

Multi-step planner:
1. traveler profile
2. accessibility / child / pet / elderly / disability needs
3. allergies and dietary needs
4. travel vibe
5. place preferences
6. food preferences
7. budget and time
8. avoid preferences
9. optional free prompt

Vibes:
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

Food:
- Thai
- Thai fusion
- Thai-Japanese
- Thai-Chinese
- Thai-Isan
- Northern Thai
- Southern Thai
- Street food
- Dessert
- Café & bakery
- Seafood
- Halal
- Vegan
- Vegetarian

## Itinerary Result requirements

Show:
- beautiful title
- route summary
- large map with animated pins
- point-to-point route
- timeline of 4–6 stops
- place cards
- budget estimate
- travel time
- walking load
- crowd comfort score
- food match score
- accessibility fit
- local authenticity score
- weather suitability score
- AI explanation panel
- alternative route tabs

## Motion

Use Framer Motion.

Add:
- page transitions
- staggered card reveals
- hover lift
- glowing map pins
- route line animation
- selected chip animation
- planner step transitions
- mock AI loading state

## Technical

Use:
- React or Next.js
- TypeScript if possible
- Tailwind CSS
- Framer Motion
- lucide-react
- shadcn/ui or polished custom components
- mock data files

Keep:
- clean components
- reusable UI
- separated mock data
- organized folder structure
- responsive layout

## Quality bar

The final output must feel like:
- premium startup product
- polished hackathon demo
- commercial travel app
- visually memorable portfolio piece

The user should want to click it.
