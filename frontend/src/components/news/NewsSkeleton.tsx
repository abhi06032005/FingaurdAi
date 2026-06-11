import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export function NewsSkeleton() {
  // Create an array of 8 items for skeleton display
  const skeletonCards = Array.from({ length: 8 });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {skeletonCards.map((_, idx) => (
        <Card 
          key={idx} 
          className="border-white/10 bg-slate-950/40 backdrop-blur-xl flex flex-col justify-between h-[420px] overflow-hidden"
        >
          {/* Card Image Placeholder */}
          <div className="relative w-full h-44">
            <Skeleton className="w-full h-full rounded-t-xl rounded-b-none" />
          </div>

          <CardHeader className="p-4 pb-2 space-y-3">
            {/* Metadata (Source & Time) Row Placeholder */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-4.5 w-24 rounded" />
              <Skeleton className="h-4 w-16 rounded" />
            </div>

            {/* Title Placeholder */}
            <div className="space-y-1.5 pt-1">
              <Skeleton className="h-5.5 w-full rounded" />
              <Skeleton className="h-5.5 w-[85%] rounded" />
            </div>
          </CardHeader>

          <CardContent className="p-4 pt-0 pb-2">
            {/* Description Placeholder */}
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-[90%] rounded" />
              <Skeleton className="h-4 w-[60%] rounded" />
            </div>
          </CardContent>

          <CardFooter className="p-4 pt-0 border-t border-white/5 flex items-center justify-between mt-auto">
            {/* Read More button placeholder */}
            <Skeleton className="h-4 w-20 rounded" />
            {/* External link icon placeholder */}
            <Skeleton className="h-4.5 w-4.5 rounded-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
