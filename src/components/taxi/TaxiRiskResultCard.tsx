import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import type { RiskLevel } from "../../types";

type TaxiRiskResultCardProps = {
  risk: RiskLevel;
  fairRange: readonly [number, number];
  offeredPrice: number;
  explanation: string;
  signals: string[];
};

const riskIcon = {
  Low: CheckCircle2,
  Medium: AlertTriangle,
  High: ShieldAlert
};

export function TaxiRiskResultCard({ risk, fairRange, offeredPrice, explanation, signals }: TaxiRiskResultCardProps) {
  const Icon = riskIcon[risk];

  return (
    <section className={`taxi-result risk-${risk.toLowerCase()}`}>
      <div className="result-topline">
        <div>
          <span className="panel-label">Mock fare result</span>
          <h2>{risk === "High" ? "Reroute recommended" : risk === "Medium" ? "Go with awareness" : "Looks reasonable"}</h2>
        </div>
        <div className="risk-badge"><Icon size={22} /> {risk}</div>
      </div>

      <div className="fare-compare">
        <div>
          <span>Fair range</span>
          <strong>{fairRange[0]}-{fairRange[1]} THB</strong>
        </div>
        <div>
          <span>Offered</span>
          <strong>{offeredPrice} THB</strong>
        </div>
      </div>

      <p>{explanation}</p>

      <div className="signal-row">
        {signals.length ? signals.map((signal) => <span key={signal}>{signal}</span>) : <span>No suspicious signals selected</span>}
      </div>

      <div className="result-actions">
        <button className="primary-pill">See safer alternatives</button>
        <button className="secondary-pill">Show Thai phrase</button>
      </div>
      <small>If you feel unsafe or threatened, move to a public area and contact Tourist Police 1155.</small>
    </section>
  );
}
