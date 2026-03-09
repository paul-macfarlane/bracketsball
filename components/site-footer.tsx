import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="container mx-auto flex flex-col items-center gap-2 px-4 py-6 text-center text-sm text-muted-foreground sm:flex-row sm:justify-between sm:text-left">
        <p>&copy; {new Date().getFullYear()} Bracketsball</p>
        <nav className="flex gap-4">
          <Link
            href="/privacy"
            className="transition-colors hover:text-foreground"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="transition-colors hover:text-foreground"
          >
            Terms of Service
          </Link>
          <a
            href="mailto:contact@bracketsball.com"
            className="transition-colors hover:text-foreground"
          >
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
