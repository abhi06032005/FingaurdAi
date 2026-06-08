"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  ChevronRight, 
  ChevronLeft, 
  Upload, 
  CheckCircle2, 
  AlertCircle,
  FileCode2,
  Lock,
  Loader2,
  FileSpreadsheet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function ReportScamPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form State
  const [scamType, setScamType] = useState("Telegram");
  const [lossRange, setLossRange] = useState("Under ₹5,000");
  const [description, setDescription] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);

  // Upload simulation state
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");

  // Step Validation Helpers
  const isStepValid = () => {
    if (step === 1) return !!scamType;
    if (step === 2) return !!lossRange;
    if (step === 3) {
      const words = description.trim().split(/\s+/).filter(Boolean).length;
      return description.trim().length > 10 && words <= 300;
    }
    if (step === 4) return true; // Evidence is technically optional or has fallback URL
    if (step === 5) return !!name && !!phone && !!email && consent;
    return false;
  };

  // Mock File Upload (simulating Cloudinary output)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setFileName(file.name);

    // Simulate upload progress
    setTimeout(() => {
      setUploading(false);
      // Simulated secure Cloudinary image URL
      const mockCloudinaryUrl = `https://res.cloudinary.com/finguard-ai/image/upload/v1717800000/scams/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      setEvidenceUrl(mockCloudinaryUrl);
    }, 2000);
  };

  // Submit report to Backend API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStepValid()) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/scam-platform/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scamType,
          lossRange,
          description,
          evidenceUrl: evidenceUrl || "None provided",
          name,
          phone,
          email,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(result.error || "Failed to submit scam report.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to reach the backend verification server.");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (isStepValid()) setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
  };

  return (
    <div className="bg-[#050506] min-h-screen text-foreground pb-20">
      
      {/* Glow highlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[900px] h-[500px] overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-150px] left-[30%] w-[40%] h-[300px] bg-red-600/10 rounded-full blur-[140px]"></div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-16 relative z-10 space-y-8">
        
        {/* Navigation header */}
        <header className="space-y-4">
          <Link href="/scams" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Scam Hub
          </Link>
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <FileSpreadsheet className="h-8 w-8 text-red-500" />
              Report a Trading Scam
            </h1>
            <p className="text-sm text-gray-400 leading-relaxed max-w-lg">
              Help us document scams targeting retail investors. All personal information remains completely confidential. Verified stories are published anonymously.
            </p>
          </div>
        </header>

        {success ? (
          <Card className="border-green-500/20 bg-green-500/5 p-8 text-center space-y-6 rounded-2xl shadow-xl">
            <div className="bg-green-500/15 text-green-400 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Report Submitted Successfully</h2>
              <p className="text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
                Thank you for contributing to community awareness. Our analyst team will review the details and contact you if verification is required.
              </p>
            </div>
            <Link href="/scams" passHref>
              <Button size="lg" className="rounded-full shadow-sm">
                Back to Scam Hub
              </Button>
            </Link>
          </Card>
        ) : (
          <Card className="border-border/60 bg-card/35 backdrop-blur-sm shadow-xl overflow-hidden rounded-2xl">
            
            {/* Steps Progress Indicator */}
            <div className="w-full bg-white/5 h-1.5 flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <div 
                  key={i} 
                  className={`flex-1 transition-all duration-300 ${
                    i <= step ? "bg-red-500" : "bg-transparent"
                  }`}
                ></div>
              ))}
            </div>

            <CardContent className="p-8 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Step 1: Scam Type */}
                {step === 1 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-lg text-white">Step 1: Scam Type</h3>
                      <p className="text-xs text-gray-500">Select the channel or method the scammers used to reach you.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {["Telegram", "WhatsApp", "Pump and Dump", "Fake Advisor", "Fake App", "Other"].map((type) => {
                        const isSelected = scamType === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setScamType(type)}
                            className={`p-4 rounded-xl border text-xs sm:text-sm font-semibold transition-all text-center cursor-pointer ${
                              isSelected 
                                ? "border-red-500/50 bg-red-500/10 text-red-400" 
                                : "border-white/5 bg-white/5 text-gray-300 hover:border-white/10 hover:bg-white/10"
                            }`}
                          >
                            {type}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 2: Loss Range */}
                {step === 2 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-lg text-white">Step 2: Loss Amount</h3>
                      <p className="text-xs text-gray-500">Select the estimated financial impact of this scam.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {["Under ₹5,000", "₹5,000 - ₹25,000", "₹25,000 - ₹1,00,000", "₹1,00,000+"].map((range) => {
                        const isSelected = lossRange === range;
                        return (
                          <button
                            key={range}
                            type="button"
                            onClick={() => setLossRange(range)}
                            className={`p-4 rounded-xl border text-xs sm:text-sm font-semibold transition-all text-left flex items-center justify-between cursor-pointer ${
                              isSelected 
                                ? "border-red-500/50 bg-red-500/10 text-red-400" 
                                : "border-white/5 bg-white/5 text-gray-300 hover:border-white/10 hover:bg-white/10"
                            }`}
                          >
                            <span>{range}</span>
                            {isSelected && <CheckCircle2 className="h-4.5 w-4.5 text-red-500" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 3: Description */}
                {step === 3 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-lg text-white">Step 3: Description</h3>
                      <p className="text-xs text-gray-500">Provide details on how the scam was conducted (Max 300 words).</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="desc" className="text-xs text-gray-400">Scam Mechanics</Label>
                      <Textarea
                        id="desc"
                        rows={8}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Tell us what happened, what they promised, how you deposited money, and when they blocked you..."
                        className="resize-none border-white/10 bg-white/5 focus:border-red-500 text-xs sm:text-sm p-4 rounded-xl leading-relaxed"
                      />
                      <div className="flex justify-between text-[10px] text-gray-500 font-semibold">
                        <span>Min 10 characters</span>
                        <span>
                          {description.trim().split(/\s+/).filter(Boolean).length} / 300 words
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Evidence Upload */}
                {step === 4 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-lg text-white">Step 4: Evidence Details (Optional)</h3>
                      <p className="text-xs text-gray-500">Provide any screenshot files, links, or chat domains to support verification.</p>
                    </div>

                    <div className="space-y-4 pt-2">
                      
                      {/* Drag & drop mock Cloudinary file uploader */}
                      <div className="border border-dashed border-white/10 bg-white/5 hover:bg-white/10 transition-colors p-6 rounded-xl text-center space-y-3 relative">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <div className="bg-white/5 text-gray-400 p-2.5 rounded-full w-11 h-11 mx-auto flex items-center justify-center">
                          {uploading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Upload className="h-5 w-5" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <span className="block text-xs font-bold text-white">
                            {uploading ? "Uploading File..." : fileName ? `File: ${fileName}` : "Upload evidence screenshot"}
                          </span>
                          <span className="block text-[10px] text-gray-500">PNG, JPG up to 5MB (Simulated Cloudinary Upload)</span>
                        </div>
                        {evidenceUrl && (
                          <Badge className="bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] py-0">
                            Cloudinary Link Generated
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="evidence_link" className="text-xs text-gray-400">Website or Telegram Channel Link</Label>
                        <Input
                          id="evidence_link"
                          placeholder="e.g. t.me/fake_wealth_group or https://fake-app.vip"
                          value={evidenceUrl && !evidenceUrl.includes("cloudinary") ? evidenceUrl : ""}
                          onChange={(e) => setEvidenceUrl(e.target.value)}
                          className="border-white/10 bg-white/5 focus:border-red-500 text-xs sm:text-sm p-4 h-10 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: Contact Info */}
                {step === 5 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-lg text-white">Step 5: Contact & Consent</h3>
                      <p className="text-xs text-gray-500">Provide details for the verification process. This will never be made public.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="name" className="text-xs text-gray-400">Full Name</Label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Abhijeet Nayak"
                          className="border-white/10 bg-white/5 focus:border-red-500 text-xs sm:text-sm h-10 rounded-xl"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="phone" className="text-xs text-gray-400">Phone Number</Label>
                        <Input
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="border-white/10 bg-white/5 focus:border-red-500 text-xs sm:text-sm h-10 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="email" className="text-xs text-gray-400">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="abhijeet@finguard.ai"
                        className="border-white/10 bg-white/5 focus:border-red-500 text-xs sm:text-sm h-10 rounded-xl"
                      />
                    </div>

                    <div className="flex items-start gap-3 border border-white/5 bg-white/5 p-4 rounded-xl mt-4">
                      <input 
                        type="checkbox"
                        id="consent" 
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="mt-1 border-white/30 accent-violet-600 h-4 w-4 cursor-pointer"
                      />
                      <div className="space-y-1">
                        <Label htmlFor="consent" className="text-xs font-semibold text-white leading-relaxed select-none cursor-pointer">
                          I allow the FinGuard analyst team to contact me for verification.
                        </Label>
                        <p className="text-[10px] text-gray-500 leading-normal">
                          All personal coordinates remain entirely secure, protected by admin-level access control.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {error && (
                  <div className="flex items-center gap-2 border border-red-500/20 bg-red-500/5 text-red-500 text-xs p-4 rounded-xl">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-6">
                  {step > 1 ? (
                    <Button type="button" variant="outline" onClick={prevStep} className="h-9 font-semibold text-xs border-white/10 rounded-lg cursor-pointer hover:bg-white/5">
                      <ChevronLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                  ) : (
                    <div></div>
                  )}

                  {step < 5 ? (
                    <Button 
                      type="button" 
                      onClick={nextStep} 
                      disabled={!isStepValid()}
                      className="bg-white hover:bg-gray-200 text-black font-semibold rounded-lg text-xs h-9 px-5 cursor-pointer disabled:opacity-50"
                    >
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <Button 
                      type="submit" 
                      disabled={!isStepValid() || loading}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs h-9 px-6 cursor-pointer flex items-center gap-1.5"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4.5 w-4.5 animate-spin" /> Submitting...
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" /> Submit Report
                        </>
                      )}
                    </Button>
                  )}
                </div>

              </form>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
