import { Copy, Volume2 } from "lucide-react";
import { thaiPhrases } from "../../data/taxi";

export function ThaiPhraseCard() {
  const phrase = thaiPhrases[0];

  return (
    <section className="phrase-card">
      <span className="panel-label">Thai phrase helper</span>
      <strong lang="th">{phrase.thai}</strong>
      <p>{phrase.english}</p>
      <small>{phrase.context}</small>
      <div className="phrase-actions">
        <button><Copy size={16} /> Copy</button>
        <button><Volume2 size={16} /> Mock audio</button>
      </div>
    </section>
  );
}
