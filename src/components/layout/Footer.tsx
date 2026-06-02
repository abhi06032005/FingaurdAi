import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t bg-muted/40 py-8">
      <div className="container mx-auto px-4 md:flex md:items-center md:justify-between">
        <div className="flex justify-center md:justify-start mb-6 md:mb-0">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold tracking-tight text-primary">FinGuard AI</span>
          </Link>
        </div>
        <div className="flex flex-wrap justify-center space-x-4 text-sm text-muted-foreground md:justify-end">
          <Link href="/about" className="hover:text-foreground">About</Link>
          <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
        </div>
      </div>
      <div className="mt-8 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} FinGuard AI. All rights reserved.
      </div>
    </footer>
  );
}
