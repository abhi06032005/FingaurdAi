"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { tradeSchema, TradeFormValues } from "./trade-schema";
import { MistakeTags } from "./mistake-tags";

import { SummaryPanel } from "./summary-panel";
import { Save, SaveAll, X } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

export function TradeForm() {
  const { userId, getToken } = useAuth();
  const form = useForm<TradeFormValues>({
    resolver: zodResolver(tradeSchema as any),
    defaultValues: {
      symbol: "",
      mistakes: [],
      confidenceScore: 5,
    },
  });

  const onSubmit = async (data: TradeFormValues) => {
    if (!userId) {
      alert("You must be logged in to save trades.");
      return;
    }
    
    try {
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/trades`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      if (response.ok) {
        alert("Trade saved successfully!");
        form.reset();
      } else {
        alert(`Failed to save trade: ${result.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while saving the trade.");
    }
  };

  const watchAllFields = form.watch();
  const watchInstrumentType = form.watch("instrumentType");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

            {/* Section 1: Trade Information */}
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-primary/10 text-primary p-2 rounded-full font-bold">1</div>
                  <h2 className="text-xl font-semibold">Trade Information</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="symbol"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Symbol</FormLabel>
                        <FormControl>
                          <Input placeholder="AAPL" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="instrumentType"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Instrument Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Equity">Equity</SelectItem>
                            <SelectItem value="Futures">Futures</SelectItem>
                            <SelectItem value="Options">Options</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="direction"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Direction</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select direction" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Long">Long</SelectItem>
                            <SelectItem value="Short">Short</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="entryPrice"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Entry Price</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="exitPrice"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Exit Price</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="entryDate"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Entry Date & Time</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="exitDate"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Exit Date & Time</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section 10: Options-Specific Fields */}
            {watchInstrumentType === "Options" && (
              <Card>
                <CardContent className="pt-6 space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-primary/10 text-primary p-2 rounded-full font-bold">Options</div>
                    <h2 className="text-xl font-semibold">Options Specific Fields</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="optionType"
                      render={({ field }: { field: any }) => (
                        <FormItem>
                          <FormLabel>Option Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="CE">CE</SelectItem>
                              <SelectItem value="PE">PE</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="strikePrice"
                      render={({ field }: { field: any }) => (
                        <FormItem>
                          <FormLabel>Strike Price</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="expiryDate"
                      render={({ field }: { field: any }) => (
                        <FormItem>
                          <FormLabel>Expiry Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="premiumPaid"
                      render={({ field }: { field: any }) => (
                        <FormItem>
                          <FormLabel>Premium Paid</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Section 2: Trade Plan */}
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-primary/10 text-primary p-2 rounded-full font-bold">2</div>
                  <h2 className="text-xl font-semibold">Trade Plan</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="plannedStopLoss"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Planned Stop Loss</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="plannedTarget"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Planned Target</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Section 3: Trade Setup */}
              <Card>
                <CardContent className="pt-6 space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-primary/10 text-primary p-2 rounded-full font-bold">3</div>
                    <h2 className="text-xl font-semibold">Trade Setup</h2>
                  </div>

                  <FormField
                    control={form.control}
                    name="strategy"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Strategy</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select strategy" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Breakout">Breakout</SelectItem>
                            <SelectItem value="Pullback">Pullback</SelectItem>
                            <SelectItem value="Reversal">Reversal</SelectItem>
                            <SelectItem value="Trend Following">Trend Following</SelectItem>
                            <SelectItem value="Scalping">Scalping</SelectItem>
                            <SelectItem value="Swing Trade">Swing Trade</SelectItem>
                            <SelectItem value="News Based">News Based</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Section 4: Confidence Score */}
              <Card>
                <CardContent className="pt-6 space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-primary/10 text-primary p-2 rounded-full font-bold">4</div>
                    <h2 className="text-xl font-semibold">Confidence Score</h2>
                  </div>

                  <FormField
                    control={form.control}
                    name="confidenceScore"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel className="flex justify-between">
                          <span>How confident were you?</span>
                          <span className="font-bold text-primary">{field.value} / 10</span>
                        </FormLabel>
                        <FormControl>
                          <Slider
                            min={1}
                            max={10}
                            step={1}
                            defaultValue={[field.value || 5]}
                            onValueChange={(vals: any) => field.onChange(Array.isArray(vals) ? vals[0] : vals)}
                            className="py-4"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Section 5: Emotion Before Entry */}
              <Card>
                <CardContent className="pt-6 space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-primary/10 text-primary p-2 rounded-full font-bold">5</div>
                    <h2 className="text-xl font-semibold">Emotion Before Entry</h2>
                  </div>

                  <FormField
                    control={form.control}
                    name="emotion"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Emotion</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select emotion" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Calm">😌 Calm</SelectItem>
                            <SelectItem value="Confident">😎 Confident</SelectItem>
                            <SelectItem value="Fear">😨 Fear</SelectItem>
                            <SelectItem value="FOMO">🏃‍♂️ FOMO</SelectItem>
                            <SelectItem value="Greed">🤑 Greed</SelectItem>
                            <SelectItem value="Revenge">😠 Revenge</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Section 6: Exit Reason */}
              <Card>
                <CardContent className="pt-6 space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-primary/10 text-primary p-2 rounded-full font-bold">6</div>
                    <h2 className="text-xl font-semibold">Exit Reason</h2>
                  </div>

                  <FormField
                    control={form.control}
                    name="exitReason"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Reason</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select exit reason" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Target Hit">Target Hit</SelectItem>
                            <SelectItem value="Stop Loss Hit">Stop Loss Hit</SelectItem>
                            <SelectItem value="Manual Exit">Manual Exit</SelectItem>
                            <SelectItem value="Profit Booking">Profit Booking</SelectItem>
                            <SelectItem value="Market Reversal">Market Reversal</SelectItem>
                            <SelectItem value="Fear Exit">Fear Exit</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Section 7: Mistake Tags */}
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-primary/10 text-primary p-2 rounded-full font-bold">7</div>
                  <h2 className="text-xl font-semibold">Mistake Tags</h2>
                </div>

                <FormField
                  control={form.control}
                  name="mistakes"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormControl>
                        <MistakeTags value={field.value || []} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Section 8: Notes */}
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-primary/10 text-primary p-2 rounded-full font-bold">8</div>
                  <h2 className="text-xl font-semibold">Notes</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tradeIdea"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Trade Idea</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="What made you take this trade?"
                            className="resize-none h-32"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {field.value?.length || 0}/500 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lessonLearned"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Lesson Learned</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="What did you learn from this trade?"
                            className="resize-none h-32"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {field.value?.length || 0}/500 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>



            {/* Bottom Action Bar */}
            <div className="sticky bottom-4 z-50 flex items-center justify-end gap-4 p-4 bg-background/80 backdrop-blur-md border rounded-xl shadow-lg mt-8">
              <Button type="button" variant="outline">
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
              <Button type="button" variant="secondary">
                <SaveAll className="mr-2 h-4 w-4" /> Save as Draft
              </Button>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" /> Save Trade
              </Button>
            </div>

          </form>
        </Form>
      </div>

      <div className="lg:col-span-1 hidden lg:block">
        <SummaryPanel values={watchAllFields} />
      </div>
    </div>
  );
}
