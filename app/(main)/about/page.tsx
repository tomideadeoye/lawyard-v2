import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About – Lawyard',
  description:
    'Lawyard is a legal media and services platform that provides enlightenment and access to legal services to members of the public while availing lawyers of needed information on new trends and resources.',
}

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-24">
      <h1 className="text-4xl font-black mb-8">About</h1>

      <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
        <p>
          Lawyard is a legal media and services platform that provides
          enlightenment and access to legal services to members of the public
          (individuals and businesses) while also availing lawyers of needed
          information on new trends and resources in various areas of practice.
        </p>

        <p>
          Whilst the platform started out with publishing legal essays
          contributed by lawyers within and outside Nigeria, Lawyard presently
          has various outputs such as the Lawyard Quarterly Journal (an
          electronic journal with top quality essays and interviews), the
          Lawyard Directory (a digital interface that provides connection
          services to members of the public seeking legal services), and the
          Lawyard Dialogue (an interactive show published on YouTube).
          Relatedly, Lawyard hosts offline engagements when necessary. In
          November 2019, Lawyard hosted the Lawyard Symposium on Privacy and
          Data Protection was organised in honour of recently demised Lawyard
          co-founder, Adavize Alao alongside a nationwide essay competition for
          young lawyers and law students.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
        <Section
          title="Overview"
          text="The intention is to create a content platform around relevant systems of law and to enable quick, easy and seamless learning through a dynamic and interactive interface."
        />
        <Section
          title="Mission"
          text="Lawyard is anticipated to operate as a seeming hybrid of a legal encyclopedia and a social media platform."
        />
        <Section
          title="Benefits"
          text="News updates on trials, mock trials, conferences, fellowships for Lawyers/Law students, amendments on laws, new laws and offences, Forums, Groups and Pages for schools, regions/states, specialties etc."
        />
      </div>
    </div>
  )
}

function Section({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-3">{title}</h2>
      <p className="text-muted-foreground leading-relaxed">{text}</p>
    </div>
  )
}
