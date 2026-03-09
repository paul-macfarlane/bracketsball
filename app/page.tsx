import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  Users,
  BarChart3,
  Zap,
  ClipboardList,
  Share2,
  ArrowRight,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/site-footer";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/pools");
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Splash Header */}
      <header className="absolute top-0 right-0 left-0 z-10">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link
            href="/"
            className="font-heading text-lg font-bold uppercase tracking-wide text-primary-foreground"
          >
            Bracketsball
          </Link>
          <Button
            asChild
            className="bg-brand-orange text-brand-orange-foreground hover:bg-brand-orange/90"
          >
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary px-4 pt-32 pb-20 text-primary-foreground md:pt-40 md:pb-28">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <BracketDecoration />
        </div>

        <div className="container relative mx-auto max-w-4xl text-center">
          <h1 className="font-heading text-5xl leading-tight font-bold uppercase tracking-wide md:text-7xl md:leading-tight">
            Your Bracket.
            <br />
            <span className="text-brand-orange">Your Glory.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-primary-foreground/80 md:text-xl">
            Create pools, fill your bracket, and compete with friends during
            March Madness. Free, fast, and built for the tournament.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="bg-brand-orange px-8 text-lg text-brand-orange-foreground hover:bg-brand-orange/90"
            >
              <Link href="/login">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-20 md:py-28">
        <div className="container mx-auto max-w-5xl">
          <h2 className="font-heading text-center text-3xl font-bold uppercase tracking-wide md:text-4xl">
            How It Works
          </h2>
          <div className="mt-14 grid gap-10 md:grid-cols-3">
            <Step
              number={1}
              icon={<Users className="h-8 w-8" />}
              title="Create a Pool"
              description="Start a pool and invite your friends with a shareable link. Set your own rules and max bracket count."
            />
            <Step
              number={2}
              icon={<ClipboardList className="h-8 w-8" />}
              title="Fill Your Bracket"
              description="Pick your winners for every game from the First Four to the Championship. Your picks auto-save as you go."
            />
            <Step
              number={3}
              icon={<Trophy className="h-8 w-8" />}
              title="Watch the Madness Unfold"
              description="Scores update live as games are played. Track standings, compare brackets, and see who takes the crown."
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-secondary px-4 py-20 md:py-28">
        <div className="container mx-auto max-w-5xl">
          <h2 className="font-heading text-center text-3xl font-bold uppercase tracking-wide md:text-4xl">
            Built for the Tournament
          </h2>
          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            <FeatureCard
              icon={<Zap className="h-6 w-6 text-brand-orange" />}
              title="Live Scoring"
              description="Bracket scores update automatically as game results come in. No manual tracking needed."
            />
            <FeatureCard
              icon={<Users className="h-6 w-6 text-brand-orange" />}
              title="Custom Pools"
              description="Configure scoring rules, max brackets per person, and pool size. Your pool, your rules."
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6 text-brand-orange" />}
              title="Live Standings"
              description="See where you rank with real-time standings. Track points earned and potential points remaining."
            />
            <FeatureCard
              icon={<Share2 className="h-6 w-6 text-brand-orange" />}
              title="Easy Invites"
              description="Share a link and your friends are in. No app downloads, no complicated setup."
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-primary px-4 py-20 text-center text-primary-foreground md:py-28">
        <div className="container mx-auto max-w-3xl">
          <h2 className="font-heading text-3xl font-bold uppercase tracking-wide md:text-4xl">
            March Madness Won&apos;t Wait
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/80">
            The tournament is coming. Get your pool set up and your brackets
            filled before tip-off.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 bg-brand-orange px-8 text-lg text-brand-orange-foreground hover:bg-brand-orange/90"
          >
            <Link href="/login">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

/* --- Sub-components --- */

function Step({
  number,
  icon,
  title,
  description,
}: {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-orange text-brand-orange-foreground">
        {icon}
      </div>
      <div className="mt-1 font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Step {number}
      </div>
      <h3 className="mt-3 text-xl font-bold">{title}</h3>
      <p className="mt-2 text-muted-foreground">{description}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-center gap-3">
        {icon}
        <h3 className="text-lg font-bold">{title}</h3>
      </div>
      <p className="mt-2 text-muted-foreground">{description}</p>
    </div>
  );
}

function BracketDecoration() {
  return (
    <svg
      className="absolute top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 opacity-[0.06]"
      viewBox="0 0 800 800"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Left bracket lines */}
      <path
        d="M 100 100 L 200 100 L 200 250 L 300 250"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        d="M 100 400 L 200 400 L 200 250 L 300 250"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        d="M 100 500 L 200 500 L 200 650 L 300 650"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        d="M 100 800 L 200 800 L 200 650 L 300 650"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        d="M 300 250 L 400 250 L 400 450 L 500 450"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        d="M 300 650 L 400 650 L 400 450 L 500 450"
        stroke="currentColor"
        strokeWidth="4"
      />

      {/* Right bracket lines (mirrored) */}
      <path
        d="M 700 100 L 600 100 L 600 250 L 500 250"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        d="M 700 400 L 600 400 L 600 250 L 500 250"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        d="M 700 500 L 600 500 L 600 650 L 500 650"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        d="M 700 800 L 600 800 L 600 650 L 500 650"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        d="M 500 250 L 400 250 L 400 450 L 500 450"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        d="M 500 650 L 400 650 L 400 450 L 500 450"
        stroke="currentColor"
        strokeWidth="4"
      />

      {/* Championship circle */}
      <circle cx="500" cy="450" r="20" stroke="currentColor" strokeWidth="4" />
    </svg>
  );
}
