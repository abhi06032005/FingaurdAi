import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/70 bg-background/72 py-10 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:flex md:items-center md:justify-between">
        <div className="mb-6 flex justify-center md:mb-0 md:justify-start">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-extrabold tracking-normal text-foreground">FinGuard AI</span>
          </Link>
        </div>
        <div className="flex flex-wrap justify-center gap-2 text-sm text-muted-foreground md:justify-end">
          <Link href="/about" className="rounded-md px-3 py-2 transition-colors hover:bg-muted/70 hover:text-foreground">About</Link>
          <Link href="/privacy" className="rounded-md px-3 py-2 transition-colors hover:bg-muted/70 hover:text-foreground">Privacy Policy</Link>
          <Link href="/terms" className="rounded-md px-3 py-2 transition-colors hover:bg-muted/70 hover:text-foreground">Terms of Service</Link>
        </div>
      </div>
      <div className="mt-8 text-center text-xs font-medium text-muted-foreground">
        &copy; {new Date().getFullYear()} FinGuard AI. All rights reserved.
      </div>
    </footer>
  );
}
