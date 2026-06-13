"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Check, Sparkles, HelpCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserDb } from "@/context/UserContext";
import { useAuth } from "@clerk/nextjs";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Declare Razorpay on window
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PlansPage() {
  const { dbUser, updatePlan, syncUser } = useUserDb();
  const { getToken } = useAuth();
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);

  const currentPlan = dbUser?.plan || "FREE";
  const reportsUsed = dbUser?.reportsUsed || 0;

  const resetTrial = async () => {
    await updatePlan("FREE");
    alert("Free trial has been reset to 0/1 used for testing!");
  };

  // Check query parameters for simulation/direct redirect success
  useEffect(() => {
    if (!dbUser) return;

    const params = new URLSearchParams(window.location.search);
    const orderIdParam = params.get("order_id");
    if (orderIdParam) {
      const verifyOrder = async () => {
        try {
          const token = await getToken();
          const res = await fetch(`${API_BASE}/api/payments/verify/${orderIdParam}`, {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });
          const result = await res.json();
          if (res.ok && result.success) {
            await syncUser();
            setPaymentSuccess(true);
          }
        } catch (err) {
          console.error("Redirect verification error:", err);
        }
        window.history.replaceState({}, document.title, window.location.pathname);
      };
      verifyOrder();
    }
  }, [dbUser, syncUser]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async (planId: string, planName: string) => {
    if (!dbUser) {
      alert("Please sign in to upgrade your plan.");
      return;
    }
    setLoadingPayment(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/payments/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          email: dbUser.email,
          plan: planId
        }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        const { order_id, amount, currency, key_id } = result;

        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          alert("Failed to load Razorpay SDK. Please check your internet connection.");
          setLoadingPayment(false);
          return;
        }

        const options = {
          key: key_id,
          amount: amount,
          currency: currency,
          name: "FinGuard AI",
          description: `Upgrade to ${planName}`,
          order_id: order_id,
          handler: function (response: any) {
            // Redirect to the success page to handle verification and webhook polling automatically
            window.location.href = `/payment-success?order_id=${response.razorpay_order_id}`;
          },
          prefill: {
            email: dbUser.email,
          },
          theme: {
            color: "#4f46e5", // Indigo 600
          },
          modal: {
            ondismiss: function() {
              setLoadingPayment(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (response: any) {
          alert(`Payment failed: ${response.error.description}`);
          setLoadingPayment(false);
        });
        rzp.open();
      } else {
        alert(result.error || "Failed to create order");
        setLoadingPayment(false);
      }
    } catch (err: any) {
      console.error("Order creation error:", err);
      alert("An error occurred during order initialization.");
      setLoadingPayment(false);
    }
  };

  const plans = [
    {
      id: "FREE",
      name: "Free Trial",
      price: 0,
      periodText: " / 1 report",
      description: "Analyze stock profiles and explore basic market ratios.",
      buttonText: currentPlan === "FREE"
        ? (reportsUsed >= 1 ? "Trial Expired" : "Current Plan")
        : "Free Tier",
      buttonVariant: "outline" as const,
      buttonDisabled: true,
      features: [
        `1 AI Stock Intelligence Report (Used: ${currentPlan === "FREE" ? reportsUsed : 0}/1)`,
        "Basic financial health checks",
        "Limited access to market news updates",
        "No trading journal database access"
      ],
      color: "border-slate-800 bg-slate-950/40"
    },
    {
      id: "STANDARD",
      name: "Standard Plan",
      price: 99,
      periodText: " / 30 days",
      description: "Perfect for active retail investors looking to check stock health and track history.",
      buttonText: currentPlan === "STANDARD" ? "Current Plan" : (loadingPayment ? "Processing..." : "Upgrade to Standard"),
      buttonVariant: currentPlan === "STANDARD" ? ("outline" as const) : ("default" as const),
      buttonDisabled: currentPlan === "STANDARD" || loadingPayment,
      features: [
        `10 AI Stock Intelligence Reports / month (Used: ${currentPlan === "STANDARD" ? reportsUsed : 0}/10)`,
        "Comprehensive fundamental screeners",
        "Real-time news alerts on market indices",
        "Basic Trading Journal (up to 50 logs)",
        "Email support (24h response time)"
      ],
      color: "border-indigo-500/30 bg-slate-900/60 shadow-lg shadow-indigo-500/5",
      badge: "Popular"
    },
    {
      id: "PREMIUM",
      name: "Premium Pro",
      price: 199,
      periodText: " / 30 days",
      description: "Ultimate toolkit for professional swing traders and fundamental analysts.",
      buttonText: currentPlan === "PREMIUM" ? "Current Plan" : (loadingPayment ? "Processing..." : "Unlock Premium Pro"),
      buttonVariant: currentPlan === "PREMIUM" ? ("outline" as const) : ("default" as const),
      buttonDisabled: currentPlan === "PREMIUM" || loadingPayment,
      features: [
        `Unlimited AI Stock Intelligence Reports (Used: ${currentPlan === "PREMIUM" ? reportsUsed : "0"})`,
        "Priority queue for PDF Annual Report processing",
        "Full Trading Journal with Unlimited logs",
        "Export prompts for personal AI Trading Coach",
        "Priority Support (1h response time)"
      ],
      color: "border-emerald-500/35 bg-slate-900/80 shadow-lg shadow-emerald-500/5",
      badge: "Elite"
    }
  ];

  return (
    <div className="min-h-screen bg-[#07090f] text-slate-100 py-16 px-4 md:px-6 relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[600px] overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-250px] left-[20%] w-[40%] h-[380px] bg-indigo-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-[-150px] right-[20%] w-[40%] h-[380px] bg-emerald-500/5 rounded-full blur-[140px]" />
      </div>

      <div className="max-w-5xl mx-auto space-y-12 relative z-10">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Subscription Plans
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            Flexible Plans for <br />
            Every Investor
          </h1>
          <p className="text-slate-400 text-base font-medium leading-relaxed">
            Gain institutional-grade fundamental stock models, unlimited scam warning reports, and powerful trading calendar logs.
          </p>
        </div>

        {/* Toggle Switch (Removed for one-time payment structure) */}
        <div className="py-2" />

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 pt-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`border rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] hover:border-slate-700/80 relative ${plan.color}`}
            >
              {plan.badge && (
                <span className={`absolute -top-3.5 right-6 px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  plan.badge === "Popular"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                }`}>
                  {plan.badge}
                </span>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-extrabold text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-1.5 leading-relaxed">{plan.description}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">₹{plan.price}</span>
                  <span className="text-xs text-slate-500 font-bold">{plan.periodText || "/ mo"}</span>
                </div>

                <ul className="space-y-3.5 border-t border-slate-800/80 pt-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300 font-bold leading-relaxed">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                <Button
                  variant={plan.buttonVariant}
                  disabled={plan.buttonDisabled}
                  onClick={() => handleUpgrade(plan.id, plan.name)}
                  className={`w-full py-6.5 rounded-2xl font-black text-xs uppercase tracking-widest cursor-pointer ${
                    plan.buttonVariant === "default"
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                      : "border-slate-800 hover:bg-slate-900/60 text-slate-400 hover:text-white"
                  }`}
                >
                  {plan.buttonText}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Tester reset action for easier review */}
        <div className="pt-6 text-center">
          <p className="text-xs text-slate-600 font-semibold">
            Testing your integration? Click below to reset the free trial reports count back to 0.
          </p>
          <button
            onClick={resetTrial}
            className="mt-3 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800/80 rounded-full text-xs font-bold text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
          >
            Reset Free Trial Counter
          </button>
        </div>

        {/* FAQ box */}
        <div className="border-t border-slate-800/60 pt-16 max-w-3xl mx-auto space-y-6">
          <h4 className="text-lg font-extrabold text-white text-center flex items-center justify-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-400" /> Subscription FAQs
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="space-y-1.5">
              <h5 className="text-sm font-bold text-white">Can I change plans at any time?</h5>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                Yes, you can upgrade, downgrade, or cancel your plan at any time. When upgrading or downgrading, your billing cycles are prorated immediately.
              </p>
            </div>
            <div className="space-y-1.5">
              <h5 className="text-sm font-bold text-white">What counts as an AI Report?</h5>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                Whenever you search and generate a context audit report for a stock symbol, it consumes 1 credit. Loading a pre-computed report from cache is free for premium tiers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {paymentSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col items-center text-center space-y-5">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Check className="w-6 h-6 animate-bounce" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-white tracking-tight">Upgrade Successful!</h3>
                <p className="text-sm text-slate-400 leading-relaxed font-medium">
                  Congratulations! Your account has been upgraded successfully. You now have full access to analyst-grade AI stock intelligence reports.
                </p>
              </div>

              <div className="w-full pt-4">
                <Link
                  href="/stocks"
                  onClick={() => setPaymentSuccess(false)}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer text-center"
                >
                  Go to Stock Analyzer
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
