"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TradeFormValues } from "./trade-schema";

interface SummaryPanelProps {
  values: Partial<TradeFormValues>;
}

export function SummaryPanel({ values }: SummaryPanelProps) {
  const {
    symbol,
    direction,
    entryPrice,
    exitPrice,
    quantity,
    entryDate,
    exitDate,
    plannedStopLoss,
    plannedTarget,
    strategy,
    confidenceScore,
    mistakes = [],
  } = values;

  // Calculations
  const entry = Number(entryPrice) || 0;
  const exit = Number(exitPrice) || 0;
  const qty = Number(quantity) || 0;

  let pnl = 0;
  if (entry > 0 && exit > 0 && qty > 0) {
    if (direction === "Long") {
      pnl = (exit - entry) * qty;
    } else if (direction === "Short") {
      pnl = (entry - exit) * qty;
    }
  }

  let percentReturn = 0;
  if (entry > 0 && exit > 0) {
    if (direction === "Long") {
      percentReturn = ((exit - entry) / entry) * 100;
    } else if (direction === "Short") {
      percentReturn = ((entry - exit) / entry) * 100;
    }
  }

  let riskReward = null;
  const stopLoss = Number(plannedStopLoss) || 0;
  const target = Number(plannedTarget) || 0;

  if (entry > 0 && stopLoss > 0 && target > 0) {
    let risk = 0;
    let reward = 0;
    if (direction === "Long") {
      risk = entry - stopLoss;
      reward = target - entry;
    } else if (direction === "Short") {
      risk = stopLoss - entry;
      reward = entry - target;
    }
    if (risk > 0) {
      riskReward = reward / risk;
    }
  }

  // Duration
  let durationStr = "-";
  if (entryDate && exitDate) {
    const start = new Date(entryDate).getTime();
    const end = new Date(exitDate).getTime();
    if (!isNaN(start) && !isNaN(end) && end >= start) {
      const diffMs = end - start;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHrs = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHrs / 24);

      if (diffDays > 0) {
        durationStr = `${diffDays}d ${diffHrs % 24}h`;
      } else if (diffHrs > 0) {
        durationStr = `${diffHrs}h ${diffMins % 60}m`;
      } else {
        durationStr = `${diffMins}m`;
      }
    }
  }

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle>Trade Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Symbol</div>
          <div className="font-bold text-lg">{symbol ? symbol.toUpperCase() : "-"}</div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Direction</div>
          <Badge variant={direction === "Long" ? "default" : "destructive"}>
            {direction || "-"}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <div className="text-sm text-muted-foreground mb-1">P&L</div>
            <div
              className={`font-bold text-2xl ${
                pnl > 0 ? "text-green-500" : pnl < 0 ? "text-red-500" : ""
              }`}
            >
              ₹{pnl.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Return</div>
            <div
              className={`font-bold text-2xl ${
                percentReturn > 0 ? "text-green-500" : percentReturn < 0 ? "text-red-500" : ""
              }`}
            >
              {percentReturn.toFixed(2)}%
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Duration</span>
            <span className="font-medium">{durationStr}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Risk / Reward</span>
            <span className="font-medium">
              {riskReward ? `1 : ${riskReward.toFixed(2)}` : "-"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Confidence</span>
            <span className="font-medium">{confidenceScore ? `${confidenceScore}/10` : "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Strategy</span>
            <span className="font-medium max-w-[150px] truncate" title={strategy}>
              {strategy || "-"}
            </span>
          </div>
        </div>

        {mistakes && mistakes.length > 0 && (
          <div className="pt-4 border-t">
            <div className="text-sm text-muted-foreground mb-2">Mistakes</div>
            <div className="flex flex-wrap gap-1">
              {mistakes.map((m) => (
                <Badge key={m} variant="secondary" className="text-xs">
                  {m}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
