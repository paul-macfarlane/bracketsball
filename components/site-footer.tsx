import Link from "next/link";
import { Github } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="container mx-auto flex items-center justify-center px-4 py-6 text-center text-sm text-muted-foreground">
        <nav className="flex items-center gap-4">
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
            href="mailto:bracketsball@gmail.com"
            className="transition-colors hover:text-foreground"
          >
            Contact
          </a>
          <a
            href="https://github.com/paul-macfarlane/bracketiering"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            <Github className="h-4 w-4" />
            <span className="sr-only">GitHub</span>
          </a>
        </nav>
      </div>
    </footer>
  );
}
