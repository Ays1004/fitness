import type { Metadata } from "next";
import { LegalPage, Section } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service · Pulse",
  description: "The terms governing your use of Pulse.",
};

const UPDATED = "June 27, 2026";

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated={UPDATED}>
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your access to and use
        of Pulse (&quot;Pulse&quot;, &quot;we&quot;, &quot;us&quot;, or
        &quot;the app&quot;), a fitness analytics dashboard that visualizes data
        from Google Fit. By accessing or using the app, you agree to be bound by
        these Terms. If you do not agree, do not use the app.
      </p>

      <Section title="1. Use of the Service">
        <p>
          Pulse provides analytics and visualizations based on fitness data you
          choose to connect. You may use the app only for lawful, personal,
          non-commercial purposes and in compliance with these Terms and all
          applicable laws and regulations.
        </p>
      </Section>

      <Section title="2. Google Account Connection">
        <p>
          To view your personal data, you may connect your Google account via
          Google OAuth. By connecting, you authorize Pulse to access the
          read-only Google Fit scopes described in our{" "}
          <a href="/privacy" className="text-emerald-400 underline">
            Privacy Policy
          </a>
          . You are responsible for maintaining the confidentiality of your
          Google account credentials. You may revoke access at any time.
        </p>
      </Section>

      <Section title="3. No Medical Advice">
        <p>
          Pulse is provided for informational and general wellness purposes
          only. The analytics, insights, and metrics shown are{" "}
          <strong>not medical advice</strong> and are not a substitute for
          professional medical guidance, diagnosis, or treatment. Always consult
          a qualified health provider regarding any health concerns. Never
          disregard professional medical advice because of something you saw in
          the app.
        </p>
      </Section>

      <Section title="4. Accuracy of Data">
        <p>
          Fitness data originates from your devices and Google Fit and may be
          incomplete, delayed, or inaccurate. When data is unavailable or when
          you have not connected an account, the app may display synthetic demo
          data clearly labeled as such. We make no warranty regarding the
          accuracy or completeness of any data or insights.
        </p>
      </Section>

      <Section title="5. Intellectual Property">
        <p>
          The app, including its design, code, and content (excluding your
          personal data), is owned by the developer and protected by applicable
          intellectual property laws. You may not copy, modify, distribute, or
          create derivative works except as expressly permitted.
        </p>
      </Section>

      <Section title="6. Acceptable Use">
        <p>You agree not to:</p>
        <ul className="list-disc space-y-1 pl-5 text-zinc-400">
          <li>Reverse engineer, scrape, or attempt to gain unauthorized access to the app or its systems.</li>
          <li>Use the app to violate any law or the rights of any third party.</li>
          <li>Interfere with or disrupt the integrity or performance of the app.</li>
          <li>Attempt to access data that does not belong to you.</li>
        </ul>
      </Section>

      <Section title="7. Disclaimer of Warranties">
        <p>
          The app is provided &quot;as is&quot; and &quot;as available&quot;
          without warranties of any kind, whether express or implied, including
          but not limited to merchantability, fitness for a particular purpose,
          and non-infringement. We do not warrant that the app will be
          uninterrupted, secure, or error-free.
        </p>
      </Section>

      <Section title="8. Limitation of Liability">
        <p>
          To the maximum extent permitted by law, in no event shall the
          developer be liable for any indirect, incidental, special,
          consequential, or punitive damages, or any loss of data, profits, or
          goodwill arising from your use of, or inability to use, the app.
        </p>
      </Section>

      <Section title="9. Termination">
        <p>
          You may stop using the app and disconnect your Google account at any
          time. We may suspend or terminate access to the app at our discretion,
          without notice, for conduct that violates these Terms or is otherwise
          harmful.
        </p>
      </Section>

      <Section title="10. Changes to These Terms">
        <p>
          We may modify these Terms from time to time. Continued use of the app
          after changes take effect constitutes acceptance of the revised Terms.
          The &quot;Last updated&quot; date above indicates when the Terms were
          last revised.
        </p>
      </Section>

      <Section title="11. Contact">
        <p>
          For questions about these Terms, contact the app developer at{" "}
          <span className="text-zinc-200">your-email@example.com</span>.
        </p>
      </Section>
    </LegalPage>
  );
}
