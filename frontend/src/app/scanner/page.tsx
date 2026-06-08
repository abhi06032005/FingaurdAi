"use client";

import { useState } from "react";
import { Shield, ShieldAlert, AlertOctagon, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ScamScanner() {
  const [message, setMessage] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<null | 'SAFE' | 'WARNING' | 'SCAM'>(null);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    setIsScanning(true);
    // Mock API call
    setTimeout(() => {
      // Mock logic: if message contains "guaranteed", it's a scam
      if (message.toLowerCase().includes("guaranteed") || message.toLowerCase().includes("double")) {
        setResult('SCAM');
      } else if (message.toLowerCase().includes("tip")) {
        setResult('WARNING');
      } else {
        setResult('SAFE');
      }
      setIsScanning(false);
    }, 1500);
  };

  return (
    <div className="container mx-auto py-10 px-4 min-h-[calc(100vh-4rem)]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-4">Scam Scanner</h1>
          <p className="text-muted-foreground">
            Paste any suspicious Telegram message, WhatsApp forward, or stock tip below to check for red flags.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Analyze Message</CardTitle>
              <CardDescription>Our AI will cross-reference the text against thousands of known scam patterns.</CardDescription>
            </CardHeader>
            <form onSubmit={handleScan}>
              <CardContent>
                <Textarea 
                  placeholder="e.g., Guaranteed 50% returns in 2 days! Join my VIP Telegram group now..."
                  className="min-h-[250px] resize-none text-base"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" size="lg" className="w-full" disabled={isScanning}>
                  {isScanning ? (
                    "Scanning for threats..."
                  ) : (
                    <>
                      <Shield className="w-5 h-5 mr-2" /> Scan Message
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Results Section */}
          <div className="space-y-6">
            {!result && !isScanning && (
              <div className="h-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-8 text-muted-foreground text-center">
                <ShieldAlert className="w-16 h-16 mb-4 opacity-20" />
                <p>Paste a message and click scan to see the analysis.</p>
              </div>
            )}

            {isScanning && (
              <div className="space-y-4">
                <div className="h-32 bg-muted animate-pulse rounded-xl"></div>
                <div className="h-64 bg-muted animate-pulse rounded-xl"></div>
              </div>
            )}

            {result === 'SCAM' && !isScanning && (
              <>
                <Card className="border-destructive shadow-sm">
                  <CardContent className="pt-6 flex items-center">
                    <AlertOctagon className="w-12 h-12 text-destructive mr-6" />
                    <div>
                      <div className="text-sm font-semibold text-destructive uppercase tracking-wider mb-1">Risk Level: Extreme</div>
                      <div className="text-3xl font-bold">98% Scam Probability</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="bg-destructive/10 border-b">
                    <CardTitle className="text-destructive">High Risk Detected</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    <div>
                      <h4 className="font-semibold mb-3">Identified Red Flags:</h4>
                      <ul className="space-y-2">
                        <li className="flex items-start">
                          <Badge variant="destructive" className="mr-2 mt-0.5">Urgency</Badge>
                          <span className="text-sm text-muted-foreground">The message attempts to create false urgency.</span>
                        </li>
                        <li className="flex items-start">
                          <Badge variant="destructive" className="mr-2 mt-0.5">Guarantee</Badge>
                          <span className="text-sm text-muted-foreground">Promises of "guaranteed" returns violate SEBI regulations.</span>
                        </li>
                      </ul>
                    </div>
                    <div className="bg-muted p-4 rounded-md text-sm leading-relaxed">
                      <strong>AI Explanation:</strong> This message closely matches the pattern of a classic "Pump and Dump" scheme often run through Telegram groups. Do not engage or invest money based on this tip.
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {result === 'SAFE' && !isScanning && (
              <>
                <Card className="border-success shadow-sm">
                  <CardContent className="pt-6 flex items-center">
                    <CheckCircle className="w-12 h-12 text-success mr-6" />
                    <div>
                      <div className="text-sm font-semibold text-success uppercase tracking-wider mb-1">Risk Level: Low</div>
                      <div className="text-3xl font-bold">Safe</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground">No obvious scam patterns were detected in this message. However, always exercise caution and do your own research before making financial decisions.</p>
                  </CardContent>
                </Card>
              </>
            )}

            {result === 'WARNING' && !isScanning && (
              <Card className="border-warning shadow-sm">
                <CardContent className="pt-6 flex items-center">
                  <ShieldAlert className="w-12 h-12 text-warning mr-6" />
                  <div>
                    <div className="text-sm font-semibold text-warning uppercase tracking-wider mb-1">Risk Level: Medium</div>
                    <div className="text-3xl font-bold">Suspicious</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
