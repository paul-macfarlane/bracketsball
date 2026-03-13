import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using Bracketsball.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <article className="prose prose-lg prose-neutral dark:prose-invert max-w-none prose-h2:mt-12 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border prose-h2:pb-3 prose-h2:text-2xl prose-p:leading-relaxed prose-li:leading-relaxed">
      <h1>Terms of Service</h1>
      <p className="text-muted-foreground">Last updated: March 8, 2026</p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By creating an account or using Bracketsball, you agree to these Terms
        of Service. If you do not agree, do not use the app.
      </p>

      <h2>2. Description of Service</h2>
      <p>
        Bracketsball is a free web application for creating and participating in
        March Madness bracket pools with friends. Users predict NCAA tournament
        game outcomes and compete for the highest score within their pools.
      </p>

      <h2>3. Accounts</h2>
      <ul>
        <li>
          You must sign in with a Google or Discord account to use Bracketsball.
        </li>
        <li>
          You are responsible for maintaining the security of your OAuth
          account.
        </li>
        <li>
          You must provide accurate information and keep your profile up to
          date.
        </li>
        <li>One person per account. Do not share accounts.</li>
      </ul>

      <h2>4. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the app for any illegal purpose</li>
        <li>
          Attempt to gain unauthorized access to other users&apos; accounts or
          app infrastructure
        </li>
        <li>
          Abuse, harass, or impersonate other users through usernames, profile
          information, or pool names
        </li>
        <li>
          Use automated scripts or bots to interact with the app without
          permission
        </li>
        <li>
          Interfere with the app&apos;s operation or other users&apos; enjoyment
        </li>
      </ul>

      <h2>5. Pool Participation</h2>
      <ul>
        <li>
          Bracketsball is for entertainment purposes only. No real money or
          prizes are facilitated by the app.
        </li>
        <li>
          Pool leaders may remove members or manage pool settings at their
          discretion.
        </li>
        <li>
          Removing yourself from a pool or being removed will permanently delete
          your bracket entries from that pool.
        </li>
      </ul>

      <h2>6. Intellectual Property</h2>
      <p>
        Bracketsball and its original content, features, and functionality are
        owned by Bracketsball. NCAA, March Madness, and team names/logos are
        property of their respective owners.
      </p>

      <h2>7. Account Termination</h2>
      <ul>
        <li>
          You may delete your account at any time from the Settings page. This
          is permanent and cannot be undone.
        </li>
        <li>
          We reserve the right to suspend or terminate accounts that violate
          these terms.
        </li>
      </ul>

      <h2>8. Limitation of Liability</h2>
      <p>
        Bracketsball is provided &ldquo;as is&rdquo; without warranties of any
        kind. We are not responsible for:
      </p>
      <ul>
        <li>Data loss or service interruptions</li>
        <li>Inaccurate or delayed sports data</li>
        <li>Actions taken by pool leaders or other users</li>
        <li>Any disputes arising from pool participation or bracket scoring</li>
      </ul>

      <h2>9. Changes to Terms</h2>
      <p>
        We may update these terms from time to time. Continued use of the app
        after changes constitutes acceptance of the updated terms.
      </p>

      <h2>10. Contact</h2>
      <p>
        For questions about these terms, email{" "}
        <a href="mailto:bracketsball@gmail.com">bracketsball@gmail.com</a>.
      </p>
    </article>
  );
}
