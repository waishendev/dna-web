"use client";

import { CSSProperties } from "react";

type FeedbackTone = "info" | "success" | "error";

type Feedback = {
  type: FeedbackTone;
  message: string;
};

type ActionBarProps = {
  onFeed: () => void;
  onTrain: () => void;
  isFeeding?: boolean;
  isTraining?: boolean;
  feedDisabled?: boolean;
  trainDisabled?: boolean;
  helperText?: string | null;
  feedback?: Feedback | null;
};

const containerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.9rem",
  borderRadius: "16px",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  background: "rgba(15, 23, 42, 0.5)",
  padding: "1.2rem 1.4rem",
};

const actionRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.75rem",
};

const baseButtonStyle: CSSProperties = {
  flex: "1 1 160px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.5rem",
  padding: "0.9rem 1.4rem",
  borderRadius: "12px",
  border: "1px solid transparent",
  fontWeight: 600,
  fontSize: "0.95rem",
  cursor: "pointer",
  transition: "transform 0.15s ease, opacity 0.15s ease",
};

const feedButtonStyle: CSSProperties = {
  background: "rgba(16, 185, 129, 0.18)",
  borderColor: "rgba(45, 212, 191, 0.45)",
  color: "#99f6e4",
};

const trainButtonStyle: CSSProperties = {
  background: "rgba(59, 130, 246, 0.2)",
  borderColor: "rgba(59, 130, 246, 0.48)",
  color: "#bfdbfe",
};

const disabledButtonStyle: CSSProperties = {
  opacity: 0.6,
  cursor: "not-allowed",
};

const messageStyle: CSSProperties = {
  fontSize: "0.92rem",
  lineHeight: 1.6,
  borderRadius: "12px",
  padding: "0.75rem 0.95rem",
  border: "1px solid transparent",
};

const helperStyle: CSSProperties = {
  fontSize: "0.88rem",
  opacity: 0.75,
};

const toneStyles: Record<FeedbackTone, CSSProperties> = {
  info: {
    color: "#cbd5f5",
    background: "rgba(59, 130, 246, 0.14)",
    borderColor: "rgba(59, 130, 246, 0.28)",
  },
  success: {
    color: "#bbf7d0",
    background: "rgba(22, 163, 74, 0.18)",
    borderColor: "rgba(34, 197, 94, 0.32)",
  },
  error: {
    color: "#fecaca",
    background: "rgba(239, 68, 68, 0.16)",
    borderColor: "rgba(248, 113, 113, 0.38)",
  },
};

function buildButtonStyle(
  base: CSSProperties,
  specific: CSSProperties,
  isDisabled: boolean,
): CSSProperties {
  if (isDisabled) {
    return { ...base, ...specific, ...disabledButtonStyle };
  }
  return { ...base, ...specific };
}

export default function ActionBar({
  onFeed,
  onTrain,
  isFeeding = false,
  isTraining = false,
  feedDisabled = false,
  trainDisabled = false,
  helperText,
  feedback,
}: ActionBarProps) {
  const feedButtonLabel = isFeeding ? "喂食中…" : "喂食";
  const trainButtonLabel = isTraining ? "训练中…" : "训练";

  const finalFeedDisabled = feedDisabled || isFeeding;
  const finalTrainDisabled = trainDisabled || isTraining;

  return (
    <footer style={containerStyle}>
      <div style={actionRowStyle}>
        <button
          type="button"
          style={buildButtonStyle(baseButtonStyle, feedButtonStyle, finalFeedDisabled)}
          onClick={() => {
            if (!finalFeedDisabled) {
              onFeed();
            }
          }}
          disabled={finalFeedDisabled}
        >
          {feedButtonLabel}
        </button>
        <button
          type="button"
          style={buildButtonStyle(baseButtonStyle, trainButtonStyle, finalTrainDisabled)}
          onClick={() => {
            if (!finalTrainDisabled) {
              onTrain();
            }
          }}
          disabled={finalTrainDisabled}
        >
          {trainButtonLabel}
        </button>
      </div>

      {feedback ? (
        <div style={{ ...messageStyle, ...toneStyles[feedback.type] }}>{feedback.message}</div>
      ) : null}

      {helperText ? <p style={helperStyle}>{helperText}</p> : null}
    </footer>
  );
}
