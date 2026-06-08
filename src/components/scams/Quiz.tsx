"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react";

interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

interface QuizProps {
  quiz: QuizQuestion[];
}

export function Quiz({ quiz }: QuizProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  if (quiz.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-muted-foreground">
        No quiz available for this category.
      </div>
    );
  }

  const currentQuestion = quiz[currentIdx];

  const handleOptionClick = (option: string) => {
    if (showFeedback) return; // Prevent double clicking
    setSelectedOption(option);
    setShowFeedback(true);
    
    if (option === currentQuestion.answer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    setShowFeedback(false);
    
    if (currentIdx + 1 < quiz.length) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setCompleted(true);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelectedOption(null);
    setShowFeedback(false);
    setScore(0);
    setCompleted(false);
  };

  return (
    <div className="border border-border/80 bg-slate-950/40 rounded-2xl p-6 md:p-8 space-y-6 max-w-2xl mx-auto shadow-sm relative overflow-hidden">
      
      {/* Background glow highlights */}
      <div className="absolute top-[10%] right-[10%] w-[30%] h-[120px] bg-violet-600/10 rounded-full blur-[60px] pointer-events-none"></div>

      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <span className="text-xs font-bold text-violet-400 uppercase tracking-widest flex items-center gap-1">
          <AlertCircle className="h-3.5 w-3.5" />
          Prevention Quiz
        </span>
        <Badge variant="secondary" className="text-[10px] font-bold px-2 bg-white/5">
          {!completed ? `Question ${currentIdx + 1} of ${quiz.length}` : "Completed"}
        </Badge>
      </div>

      {!completed ? (
        <div className="space-y-6">
          <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
            {currentQuestion.question}
          </h3>

          <div className="space-y-3">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedOption === option;
              const isCorrect = option === currentQuestion.answer;
              
              let optionStyle = "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:border-white/20";
              let statusIcon = null;

              if (showFeedback) {
                if (isCorrect) {
                  optionStyle = "border-green-500/50 bg-green-500/10 text-green-400";
                  if (isSelected) {
                    statusIcon = <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />;
                  }
                } else if (isSelected) {
                  optionStyle = "border-red-500/50 bg-red-500/10 text-red-400";
                  statusIcon = <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />;
                } else {
                  optionStyle = "border-white/5 bg-white/5 text-gray-500 opacity-60";
                }
              }

              return (
                <button
                  key={option}
                  disabled={showFeedback}
                  onClick={() => handleOptionClick(option)}
                  className={`w-full flex items-center justify-between gap-3 text-left p-4 rounded-xl border text-xs sm:text-sm transition-all font-medium disabled:cursor-not-allowed ${optionStyle}`}
                >
                  <span>{option}</span>
                  {statusIcon}
                </button>
              );
            })}
          </div>

          {showFeedback && (
            <div className="flex items-center justify-between pt-2 border-t border-white/5 animate-fade-in">
              <span className="text-xs text-gray-400 font-semibold leading-relaxed">
                {selectedOption === currentQuestion.answer ? (
                  <span className="text-green-400">Correct! Great job.</span>
                ) : (
                  <span>
                    Incorrect. Correct answer: <strong className="text-white font-bold">{currentQuestion.answer}</strong>
                  </span>
                )}
              </span>
              <Button onClick={handleNext} className="bg-white hover:bg-gray-200 text-black font-semibold rounded-lg text-xs px-4">
                {currentIdx + 1 < quiz.length ? "Next Question" : "Finish Quiz"}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6 space-y-6">
          <div className="text-4xl font-extrabold text-white">
            {score} / {quiz.length}
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-base text-white">
              {score === quiz.length ? "Perfect Score!" : score >= quiz.length / 2 ? "Good Job!" : "Review Required"}
            </h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
              {score === quiz.length 
                ? "You have a solid understanding of how to detect and prevent this trading scam scheme." 
                : "We suggest reading the warning signs and prevention rules again to secure your trading capital."}
            </p>
          </div>
          <Button onClick={handleRestart} variant="outline" className="border-white/10 hover:bg-white/5 text-xs font-semibold rounded-lg flex items-center gap-1.5 mx-auto cursor-pointer">
            <RefreshCw className="h-3.5 w-3.5" /> Restart Quiz
          </Button>
        </div>
      )}
    </div>
  );
}
