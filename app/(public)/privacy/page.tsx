import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Bracketsball",
  description: "How Bracketsball collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <h1>Privacy Policy</h1>
      <p className="text-muted-foreground">Last updated: March 8, 2026</p>

      <h2>1. Information We Collect</h2>
      <p>
        When you sign in with Google or Discord, we receive your name, email
        address, and profile picture from the OAuth provider. We do not receive
        or store your password.
      </p>
      <p>We also collect:</p>
      <ul>
        <li>
          <strong>Profile information</strong> you provide (display name,
          username)
        </li>
        <li>
          <strong>Bracket picks and pool activity</strong> you create within the
          app
        </li>
        <li>
          <strong>Usage data</strong> such as pages visited and actions taken
          (via server logs)
        </li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To authenticate your identity and manage your account</li>
        <li>To display your profile to other pool members</li>
        <li>To calculate bracket scores and pool standings</li>
        <li>To improve the app and fix bugs</li>
      </ul>

      <h2>3. Data Sharing</h2>
      <p>
        We do not sell your personal information. Your data is shared only in
        these limited ways:
      </p>
      <ul>
        <li>
          <strong>Within pools:</strong> Your username, profile picture, bracket
          picks, and scores are visible to other members of pools you join.
        </li>
        <li>
          <strong>Service providers:</strong> We use Vercel (hosting), Neon
          (database), and Google/Discord (authentication). These providers
          process data on our behalf under their own privacy policies.
        </li>
      </ul>

      <h2>4. Cookies</h2>
      <p>
        We use essential cookies for authentication and session management. We
        do not use advertising or tracking cookies.
      </p>

      <h2>5. Data Retention</h2>
      <p>
        Your account data is retained as long as your account is active. If you
        delete your account, your personal information is removed and your
        activity is anonymized to maintain pool data integrity.
      </p>

      <h2>6. Your Rights</h2>
      <p>You can:</p>
      <ul>
        <li>
          <strong>Access and update</strong> your profile information at any
          time
        </li>
        <li>
          <strong>Delete your account</strong> from the Settings page, which
          removes your personal data and anonymizes your activity
        </li>
        <li>
          <strong>Contact us</strong> at{" "}
          <a href="mailto:contact@bracketsball.com">contact@bracketsball.com</a>{" "}
          with any privacy questions
        </li>
      </ul>

      <h2>7. Security</h2>
      <p>
        We use industry-standard security measures including encrypted
        connections (HTTPS), secure session management, and OAuth-based
        authentication. No passwords are stored.
      </p>

      <h2>8. Changes to This Policy</h2>
      <p>
        We may update this policy from time to time. Changes will be posted on
        this page with an updated date.
      </p>

      <h2>9. Contact</h2>
      <p>
        For privacy questions or data requests, email{" "}
        <a href="mailto:contact@bracketsball.com">contact@bracketsball.com</a>.
      </p>
    </article>
  );
}
