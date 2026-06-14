"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { useUserDb } from "@/context/UserContext";
import { useAuth } from "@clerk/nextjs";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { syncUser } = useUserDb();
  const { getToken } = useAuth();
  const orderId = searchParams.get("order_id");

  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");
  const [errorMessage, setErrorMessage] = useState("");
  const verificationStarted = useRef(false);

  useEffect(() => {
    if (!orderId) {
      setStatus("failed");
      setErrorMessage("No order ID was found in the URL. Please verify your payment receipt.");
      return;
    }

    if (verificationStarted.current) return;
    verificationStarted.current = true;

    const verifyPayment = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_BASE}/api/payments/verify/${orderId}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const result = await res.json();

        if (res.ok && result.success) {
          // Sync DB User Context
          await syncUser();
          setStatus("success");
        } else {
          setStatus("failed");
          setErrorMessage(result.error || "Payment verification failed.");
        }
      } catch (err) {
        console.error("Verification error:", err);
        setStatus("failed");
        setErrorMessage("Could not connect to verification server.");
      }
    };

    verifyPayment();
  }, [orderId, syncUser, getToken]);

  return (
    <div className="min-h-screen bg-[#07090f] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-2xl relative z-10 text-center space-y-6">
        
        {status === "verifying" && (
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">Verifying Payment</h2>
            <p className="text-sm text-slate-400 leading-relaxed font-medium">
              We are connecting with the payment gateway to verify your transaction. Please do not close or reload this page.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-6 h-6 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">Payment Successful!</h2>
            <p className="text-sm text-slate-400 leading-relaxed font-medium">
              Thank you for your purchase. Your plan is now active! You have been successfully upgraded.
            </p>
            <div className="pt-6">
              <button
                onClick={() => router.push("/stocks")}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                Start Analyzing Stocks <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {status === "failed" && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">Verification Failed</h2>
            <p className="text-sm text-slate-400 leading-relaxed font-medium">
              {errorMessage || "We could not verify your payment transaction status at this moment."}
            </p>
            <div className="pt-6 space-y-2">
              <Link
                href="/plans"
                className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                Return to Plans
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#07090f] text-slate-100 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
