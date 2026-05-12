export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-24 animate-fade-in">
      <div className="text-center mb-16 space-y-4">
        <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-[0.2em] uppercase">
          Institutional Protocol
        </div>
        <h1 className="text-5xl font-black italic">Terms & <span className="gradient-text">Conditions</span></h1>
        <p className="text-muted-foreground">Effective Date: May 2026 | Lawyard Institutional Brand</p>
      </div>

      <div className="premium-card prose prose-invert max-w-none space-y-12">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-primary">Overview</h2>
          <p className="opacity-80 leading-relaxed">
            This Terms of Service describes the policies for the use of the Lawyard Directory. By accessing this platform, you agree to these conditions.
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold text-accent">Intellectual Property & Copyright</h3>
          <p className="opacity-80">
            All content on this website is Copyright © Lawyard 2026. We retain all rights to our works. You are not permitted to reuse, reproduce, or plagiarize our content, images, or graphics without prior written consent.
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold text-accent">Governing Law</h3>
          <p className="opacity-80">
            This website is managed from Nigeria, and as such, Nigerian laws apply to us. Disputes arising from the use of this directory shall be governed by the laws of the Federal Republic of Nigeria.
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold text-accent">Liability & Third-Party Links</h3>
          <p className="opacity-80">
            This website contains links to other websites. As those websites have their own policies independent of ours, we are not responsible for their security or any content they contain. 
          </p>
          <p className="opacity-80 font-medium">
            We make every effort to provide trustworthy, accurate content. However, any opinions expressed are those of the authors, and we are not liable for results obtained from copying or relying upon our content.
          </p>
        </section>
      </div>
    </div>
  );
}