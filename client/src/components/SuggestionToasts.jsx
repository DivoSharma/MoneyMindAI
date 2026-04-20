import { useEffect, useMemo, useState } from "react";
import { Lightbulb, X } from "lucide-react";

export default function SuggestionToasts({ suggestions, onOpenSuggestion }) {
  const items = useMemo(() => suggestions || [], [suggestions]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hiddenIds, setHiddenIds] = useState([]);

  const visibleSuggestions = items.filter((item) => !hiddenIds.includes(item.id));
  const activeSuggestion = visibleSuggestions[activeIndex % Math.max(visibleSuggestions.length, 1)];

  useEffect(() => {
    if (visibleSuggestions.length <= 1) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % visibleSuggestions.length);
    }, 14000);

    return () => window.clearInterval(interval);
  }, [visibleSuggestions.length]);

  useEffect(() => {
    setActiveIndex(0);
  }, [items]);

  if (!activeSuggestion) {
    return null;
  }

  return (
    <div className="toast-stack" aria-live="polite">
      <article className="suggestion-toast">
        <div className="suggestion-toast-head">
          <span className="toast-icon">
            <Lightbulb size={16} />
          </span>
          <strong>{activeSuggestion.title}</strong>
          <button
            aria-label="Dismiss suggestion"
            className="toast-dismiss"
            onClick={() => setHiddenIds((current) => [...current, activeSuggestion.id])}
            type="button"
          >
            <X size={14} />
          </button>
        </div>

        <p>{activeSuggestion.body}</p>

        <button className="inline-action" onClick={() => onOpenSuggestion?.(activeSuggestion.prompt)} type="button">
          Ask AI
        </button>
      </article>
    </div>
  );
}
