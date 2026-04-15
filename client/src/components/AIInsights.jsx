export default function AIInsights({ analysis, isAnalyzing, onAnalyze, source }) {
  return (
    <section className="card insights-card">
      <div className="card-header card-header-inline">
        <div>
          <span className="eyebrow">AI Analyze</span>
          <h2>Personal finance insights</h2>
          <p>Turn raw expenses into friendly guidance around habits, savings, and investing.</p>
        </div>

        <button className="button button-primary" disabled={isAnalyzing} onClick={onAnalyze} type="button">
          {isAnalyzing ? "Analyzing..." : "Analyze My Spending"}
        </button>
      </div>

      {analysis ? (
        <div className="insights-panel">
          <div className="insights-meta">
            <span>{source === "groq" ? "Powered by Groq" : "Fallback advice"}</span>
          </div>
          <pre>{analysis}</pre>
        </div>
      ) : (
        <div className="empty-state">
          Press the analyze button to get AI guidance on bad habits, savings potential, and simple
          Indian investment options like FD and SIP.
        </div>
      )}
    </section>
  );
}
