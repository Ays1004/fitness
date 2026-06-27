import type { Metadata } from "next";
import { LegalPage, Section } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy · Pulse",
  description: "How Pulse handles your Google Fit data.",
};

const UPDATED = "June 27, 2026";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated={UPDATED}>
      <p>
        This Privacy Policy explains how Pulse (&quot;Pulse&quot;,
        &quot;we&quot;, &quot;us&quot;, or &quot;the app&quot;) collects, uses,
        and protects information when you use the application. Pulse is a fitness
        analytics dashboard that visualizes data from Google Fit. By using the
        app, you agree to the practices described below.
      </p>

      <Section title="Summary">
        <ul className="list-disc space-y-1 pl-5 text-zinc-400">
          <li>We only access your Google Fit data after you explicitly connect your account and grant consent.</li>
          <li>We request <strong>read-only</strong> access to your fitness data.</li>
          <li>Your data is used solely to display analytics back to you in your own session.</li>
          <li>We do not sell your data, and we do not use it for advertising.</li>
          <li>Access tokens are stored in secure, httpOnly cookies in your browser session and are never exposed to client-side JavaScript.</li>
        </ul>
      </Section>

      <Section title="Information We Access">
        <p>
          When you choose to connect your Google account, Pulse requests the
          following read-only Google Fitness scopes to generate your dashboard:
        </p>
        <ul className="list-disc space-y-1 pl-5 text-zinc-400">
          <li><strong>Activity</strong> — steps, active minutes, and calories.</li>
          <li><strong>Location</strong> — distance traveled during activities.</li>
          <li><strong>Body</strong> — body weight measurements.</li>
          <li><strong>Heart rate</strong> — heart rate readings.</li>
          <li><strong>Sleep</strong> — sleep duration.</li>
        </ul>
        <p>
          If you do not connect a Google account, Pulse displays only synthetic
          demo data and accesses none of your personal information.
        </p>
      </Section>

      <Section title="How We Use Your Information">
        <p>
          We use the data described above exclusively to compute and display
          fitness analytics — such as trends, averages, goal progress, streaks,
          and insights — within your active session. Processing happens on the
          server only to fetch and aggregate the data requested by your browser.
        </p>
      </Section>

      <Section title="Data Storage and Retention">
        <p>
          Pulse does not maintain a database of your fitness data. Your Google
          OAuth access and refresh tokens are stored in httpOnly browser cookies
          so the app can retrieve data on your behalf during your session.
          Fitness data is fetched on demand and is not persisted by the app
          beyond what your browser caches for display. You can clear stored
          tokens at any time by clicking <strong>Disconnect</strong>, which
          deletes the session cookies.
        </p>
      </Section>

      <Section title="Google API Services User Data Policy">
        <p>
          Pulse&apos;s use and transfer of information received from Google APIs
          adheres to the{" "}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 underline"
          >
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements. We do not use Google user
          data for serving advertisements, and we do not transfer or sell this
          data to third parties.
        </p>
      </Section>

      <Section title="Data Sharing">
        <p>
          We do not share, sell, rent, or trade your personal data with third
          parties. Data is transmitted only between your browser, the Pulse
          server, and Google&apos;s APIs to fulfill your requests.
        </p>
      </Section>

      <Section title="Security">
        <p>
          We take reasonable measures to protect your information. OAuth client
          secrets are kept server-side and never sent to the browser. Access
          tokens are stored in httpOnly, SameSite cookies, marked secure in
          production. However, no method of transmission or storage is
          completely secure, and we cannot guarantee absolute security.
        </p>
      </Section>

      <Section title="Revoking Access">
        <p>
          You can disconnect Pulse from within the app at any time. You may also
          revoke the app&apos;s access to your Google account directly from your{" "}
          <a
            href="https://myaccount.google.com/permissions"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 underline"
          >
            Google Account permissions page
          </a>
          .
        </p>
      </Section>

      <Section title="Children's Privacy">
        <p>
          Pulse is not intended for use by individuals under the age of 13 (or
          the minimum age required in your jurisdiction). We do not knowingly
          collect data from children.
        </p>
      </Section>

      <Section title="Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. Material changes
          will be reflected by updating the &quot;Last updated&quot; date at the
          top of this page.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          If you have questions about this Privacy Policy, please contact the app
          developer at{" "}
          <span className="text-zinc-200">your-email@example.com</span>.
        </p>
      </Section>
    </LegalPage>
  );
}
