import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { useState } from "react";
import {
  accessibilityNeeds,
  avoidPreferences,
  foodPreferences,
  placePreferences,
  travelerProfiles,
  travelVibes
} from "../../data/plannerOptions";
import { planTrip } from "../../lib/tripApi";
import { useTripConditions } from "../../lib/tripConditions";
import type { PageKey, PlannerRequest, TripPlan } from "../../types";
import { TripConditionsMini } from "../trip/TripConditionsMini";
import { BudgetSelector } from "./BudgetSelector";
import { SelectableOptionCard } from "./SelectableOptionCard";

const steps = [
  { label: "Traveler", title: "Who is traveling?", options: travelerProfiles },
  { label: "Needs", title: "What should the route support?", options: accessibilityNeeds },
  { label: "Vibe", title: "Design a trip around how you want to feel", options: travelVibes },
  { label: "Places", title: "What places should we lean toward?", options: placePreferences },
  { label: "Food", title: "What food should fit the day?", options: foodPreferences },
  { label: "Budget", title: "Set budget and pace", options: [] },
  { label: "Prompt", title: "Add a personal note", options: avoidPreferences }
];

type PlannerStepperProps = {
  onNavigate: (page: PageKey) => void;
  onTripPlanGenerated: (plan: TripPlan) => void;
};

export function PlannerStepper({ onNavigate, onTripPlanGenerated }: PlannerStepperProps) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<Record<string, string[]>>({
    Traveler: ["Couple"],
    Needs: ["Low walking load"],
    Vibe: ["Ancient Thailand"],
    Places: ["Museums", "Old town"],
    Food: ["Thai", "Dessert"],
    Prompt: ["Outdoor heat"]
  });
  const [budget, setBudget] = useState("Medium");
  const [customBudget, setCustomBudget] = useState("");
  const [prompt, setPrompt] = useState("I want a calm cultural day with temples, Thai desserts, and not too much walking.");
  const [loading, setLoading] = useState(false);
  const [plannerMessage, setPlannerMessage] = useState("");
  const current = steps[step];
  const progress = ((step + 1) / steps.length) * 100;
  const activeBudget = customBudget.trim() || budget;
  const summaryConditions = useTripConditions();

  const toggle = (group: string, option: string) => {
    setSelected((currentSelected) => {
      const groupValues = currentSelected[group] ?? [];
      const nextValues = groupValues.includes(option)
        ? groupValues.filter((item) => item !== option)
        : [...groupValues, option];
      return { ...currentSelected, [group]: nextValues };
    });
  };

  const generate = async () => {
    setLoading(true);
    setPlannerMessage("");
    const request: PlannerRequest = { selected, budget: activeBudget, prompt };
    const plan = await planTrip(request);
    onTripPlanGenerated(plan);
    setLoading(false);
    setPlannerMessage(plan.source === "typhoon" ? "Typhoon selected from local candidates." : "Using local fallback route.");
    onNavigate("itinerary");
  };

  return (
    <div className="planner-layout">
      <section className="planner-panel">
        <div className="stepper-track">
          {steps.map((item, index) => (
            <button key={item.label} className={index === step ? "step-dot step-dot-active" : "step-dot"} onClick={() => setStep(index)}>
              <span>{index + 1}</span>
              <em>{item.label}</em>
            </button>
          ))}
        </div>
        <div className="progress-bar"><span style={{ width: `${progress}%` }} /></div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current.label}
            className="step-content"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.28 }}
          >
            <span className="panel-label">Step {step + 1} of {steps.length}</span>
            <h1>{current.title}</h1>
            {step === 5 ? (
              <>
                <BudgetSelector
                  selected={budget}
                  onSelect={(value) => {
                    setBudget(value);
                    setCustomBudget("");
                  }}
                />
                <label className="field prompt-field">
                  <span>Custom money prompt</span>
                  <input
                    value={customBudget}
                    onChange={(event) => setCustomBudget(event.target.value)}
                    placeholder="Example: Keep the route under 1,800 THB including food and entries"
                  />
                </label>
              </>
            ) : step === 6 ? (
              <>
                <div className="option-grid compact-options">
                  {current.options.map((option) => (
                    <SelectableOptionCard
                      key={option}
                      label={option}
                      selected={(selected[current.label] ?? []).includes(option)}
                      onClick={() => toggle(current.label, option)}
                    />
                  ))}
                </div>
                <label className="field prompt-field">
                  <span>Optional prompt</span>
                  <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} />
                </label>
              </>
            ) : (
              <div className="option-grid">
                {current.options.map((option) => (
                  <SelectableOptionCard
                    key={option}
                    label={option}
                    description={step === 2 ? "Shapes mood, pacing, and route style" : undefined}
                    selected={(selected[current.label] ?? []).includes(option)}
                    onClick={() => toggle(current.label, option)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="planner-actions">
          <button className="secondary-pill" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}>
            <ArrowLeft size={16} /> Back
          </button>
          {step < steps.length - 1 ? (
            <button className="primary-pill" onClick={() => setStep((value) => Math.min(steps.length - 1, value + 1))}>
              Next <ArrowRight size={16} />
            </button>
          ) : (
            <button className="primary-pill" disabled={loading} onClick={generate}>
              Build my route <Sparkles size={16} />
            </button>
          )}
        </div>
      </section>

      <aside className="planner-summary">
        <span className="panel-label">Personal route brief</span>
        <h2>Crafted around comfort, food, and local character.</h2>
        <dl>
          <div><dt>Traveler</dt><dd>{(selected.Traveler ?? []).join(", ")}</dd></div>
          <div><dt>Vibe</dt><dd>{(selected.Vibe ?? []).join(", ")}</dd></div>
          <div><dt>Food</dt><dd>{(selected.Food ?? []).join(", ")}</dd></div>
          <div><dt>Budget</dt><dd>{activeBudget}</dd></div>
        </dl>
        <div className="planner-summary-conditions">
          <span className="condition-panel-caption">Bangkok now</span>
          <TripConditionsMini {...summaryConditions} />
        </div>
        {loading && (
          <motion.div className="ai-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Sparkles size={18} />
            <span>Grounding real Bangkok candidates...</span>
          </motion.div>
        )}
        {plannerMessage && <p className="planner-status">{plannerMessage}</p>}
      </aside>
    </div>
  );
}
