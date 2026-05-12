export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-24 animate-fade-in">
      <div className="text-center mb-16 space-y-4">
        <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-[0.2em] uppercase">
          Legal Protocol
        </div>
        <h1 className="text-5xl font-black italic">Privacy <span className="gradient-text">Policy</span></h1>
        <p className="text-muted-foreground">Last Updated: May 2026 | Lawyard Institutional Brand</p>
      </div>

      <div className="premium-card prose prose-invert max-w-none space-y-12">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-primary">Overview</h2>
          <p className="opacity-80 leading-relaxed">
            Our website address is: <span className="text-accent font-mono">https://www.directory.lawyard.org</span>. 
            This platform exists to provide access to legal professionals across Africa. Privacy and data integrity are core to the Lawyard Protocol.
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold text-accent">Comments & Interaction</h3>
          <p className="opacity-80">
            When visitors leave comments on the site we collect the data shown in the comments form, and also the visitor’s IP address and browser user agent string to help spam detection.
          </p>
          <p className="opacity-80">
            An anonymized string created from your email address (also called a hash) may be provided to the Gravatar service to see if you are using it. After approval of your comment, your profile picture is visible to the public in the context of your comment.
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold text-accent">Media & Metadata</h3>
          <p className="opacity-80">
            If you upload images to the website, you should avoid uploading images with embedded location data (EXIF GPS) included. Visitors to the website can download and extract any location data from images on the website.
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold text-accent">Cookie Protocol</h3>
          <p className="opacity-80">
            If you leave a comment on our site you may opt-in to saving your name, email address and website in cookies. These are for your convenience and last for one year.
          </p>
          <p className="opacity-80">
            If you edit or publish an article, an additional cookie will be saved in your browser. This cookie includes no personal data and simply indicates the post ID of the article you just edited. It expires after 1 day.
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold text-accent">Data Retention & Rights</h3>
          <p className="opacity-80">
            For users that register on our website, we also store the personal information they provide in their user profile. All users can see, edit, or delete their personal information at any time (except they cannot change their username).
          </p>
          <p className="opacity-80 font-medium">
            If you have an account, you can request an exported file of the personal data we hold about you, or request that we erase any personal data we hold (excluding data we are obliged to keep for administrative, legal, or security purposes).
          </p>
        </section>

        <div className="pt-8 border-t border-border text-center">
          <p className="text-xs text-muted-foreground italic">
            © 2026 Lawyard. All Institutional Data Rights Reserved. 
          </p>
        </div>
      </div>
    </div>
  );
}