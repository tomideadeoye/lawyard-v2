export interface MockArticle {
  id: string
  title: string
  slug: string
  category: string
  created_at: string
  excerpt: string
  featured_image: string
  content: string
  authorName: string
  authorAvatar: string
  readTime: string
  sharesCount: string
}

export const MOCK_ARTICLES_DATA: Record<string, MockArticle> = {
  "african-development-bank-approves-usd-125-million-investment-to-expand-risk-insurance-capacity": {
    id: "spotlight-1",
    title: "African Development Bank approves USD 125 million investment to expand risk insurance capacity",
    slug: "african-development-bank-approves-usd-125-million-investment-to-expand-risk-insurance-capacity",
    category: "BLOG, LAWYARD SPOTLIGHT, NEWS",
    created_at: "2026-06-11T04:47:47.000Z",
    excerpt: "AfDB invests $125M in ATIDI to boost trade and investment risk insurance capacity across Africa, supporting FDI and intra-African trade.",
    featured_image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=1200",
    authorName: "Lawyard Staff",
    authorAvatar: "https://secure.gravatar.com/avatar/a50d8af14e795e21996e5741d6fb78233d844f94dd598c55e69803a56c3f1d60?s=80",
    readTime: "2 MINS READ",
    sharesCount: "0 SHARES",
    content: `<p>The Board of Directors at the African Development Bank Group (AfDB) has approved, in May, a USD 125 million equity investment in the African Trade and Investment Development Insurance (ATIDI) to help meet rising demand for trade and investment risk mitigation products in Africa.</p>
<p>This investment is aimed at supporting ATIDI’s capital base while expanding its political risk and credit insurance products designed to push foreign direct investment and intra-African trade.</p>
<p>ATIDI, legally known as the African Trade Insurance Agency, offers trade, credit and political investment insurance to businesses and investors operating across its African member states. Its products are designed to help mitigate commercial and political risks associated with trade and investment on the continent.</p>
<p>“The proposed investment is in line with the Bank’s Ten-Year Strategy (2024–2033), as it encourages private-sector solutions and increases financing for Africa,” said African Development Bank Group Vice President for Private Sector, Infrastructure, and Industrialisation, Solomon Quaynor.</p>
<p>“It is also fully in line with the policy on non-sovereign operations, which aims to support the financing of private-sector investments and projects in regional member countries, and aligns with the African Continental Free Trade Area in its aim to increase regional trade across the continent.”</p>
<p>ATIDI’s CEO, Manuel Moses, added: “This equity investment is yet another milestone in the exemplary partnership between ATIDI and the African Development Bank Group. The Bank became a member of ATIDI in 2013 and, since then, our institutions have successfully collaborated to grow ATIDI’s geographic footprint and outreach to African governments, de-risk part of the Bank’s portfolio and enable flagship developmental projects across the continent. We are happy to further strengthen our bond with the AfDB to support Africa’s New Financial Architecture for Development (NAFAD) and catalyse trade and investment at the scale where it sustainably drives the continent’s economic emergence. The best is still to come.”</p>`
  },
  "federal-high-court-jails-five-for-2025-papiri-school-terror-attack": {
    id: "featured-1",
    title: "Federal High Court Jails Five for 2025 Papiri School Terror Attack",
    slug: "federal-high-court-jails-five-for-2025-papiri-school-terror-attack",
    category: "NEWS",
    created_at: "2026-06-12T20:00:00.000Z",
    excerpt: "The Federal High Court sitting in Abuja has sentenced each of the five suspects arrested on May 31, 2026, for school terrorism.",
    featured_image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=1200",
    authorName: "Lawyard Staff",
    authorAvatar: "https://secure.gravatar.com/avatar/a50d8af14e795e21996e5741d6fb78233d844f94dd598c55e69803a56c3f1d60?s=80",
    readTime: "5 MINS READ",
    sharesCount: "0 SHARES",
    content: `<p>The Federal High Court sitting in Abuja has sentenced each of the five suspects arrested on May 31, 2026, by the Department of State Services (DSS) for their involvement in the November 2025 Papiri school terror attack.</p>
<p>The presiding judge ruled that the evidence presented by the prosecution proved beyond reasonable doubt that the accused conspired and executed the attack, resulting in extensive property damage and psychological trauma to the community.</p>
<p>This ruling is seen as a significant victory for national security and judicial enforcement against acts of terrorism targeting educational institutions in Nigeria.</p>`
  },
  "lagos-court-jails-279-hoodlums-after-safety-agency-raid": {
    id: "grid-1",
    title: "Lagos Court Jails 279 Hoodlums After Safety Agency Raid",
    slug: "lagos-court-jails-279-hoodlums-after-safety-agency-raid",
    category: "NEWS",
    created_at: "2026-06-12T19:00:00.000Z",
    excerpt: "Lagos State Task Force has raided and arrested several hoodlums posing safety threats in metropolitan centers.",
    featured_image: "https://images.unsplash.com/photo-1505664194779-8bebcb95c02e?auto=format&fit=crop&q=80&w=1200",
    authorName: "Lawyard Staff",
    authorAvatar: "https://secure.gravatar.com/avatar/a50d8af14e795e21996e5741d6fb78233d844f94dd598c55e69803a56c3f1d60?s=80",
    readTime: "11 MINS READ",
    sharesCount: "0 SHARES",
    content: `<p>A Lagos State Mobile Court has sentenced 279 individuals arrested in a security sweep by safety agencies across major transit hubs.</p>
<p>The state government has reiterated its zero-tolerance policy for street level threats, illegal trade stand-offs, and activities that disrupt public transit systems in Lagos.</p>
<p>Legal representatives for some of the defendants have appealed for community service alternatives, highlighting the need for restorative justice policies.</p>`
  },
  "cbn-proposes-stricter-regulation-of-banks-affiliated-companies-business-dealings": {
    id: "grid-2",
    title: "CBN proposes stricter regulation of banks, affiliated companies' business dealings",
    slug: "cbn-proposes-stricter-regulation-of-banks-affiliated-companies-business-dealings",
    category: "NEWS",
    created_at: "2026-06-12T18:00:00.000Z",
    excerpt: "The Central Bank of Nigeria has introduced new guidelines for corporate banking transactions and cross-border assets management.",
    featured_image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200",
    authorName: "Lawyard Staff",
    authorAvatar: "https://secure.gravatar.com/avatar/a50d8af14e795e21996e5741d6fb78233d844f94dd598c55e69803a56c3f1d60?s=80",
    readTime: "3 MINS READ",
    sharesCount: "0 SHARES",
    content: `<p>The Central Bank of Nigeria (CBN) has released a new regulatory proposal aiming to limit complex credit exposures between commercial banks and their subsidiaries.</p>
<p>The policy directives aim to insulate commercial banking deposits from speculative investment banking holdings, ensuring structural stability inside the domestic market.</p>
<p>Industry analysts have expressed mixed reviews, warning of potential liquidity tightening in structural venture markets.</p>`
  },
  "senate-moves-to-expand-judiciary-introduce-virtual-courts": {
    id: "grid-3",
    title: "Senate Moves to Expand Judiciary, Introduce Virtual Courts",
    slug: "senate-moves-to-expand-judiciary-introduce-virtual-courts",
    category: "NEWS",
    created_at: "2026-06-12T17:00:00.000Z",
    excerpt: "The Senate has passed the first reading of a bill to authorize digital courtrooms and remote hearing protocols nationwide.",
    featured_image: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&q=80&w=1200",
    authorName: "Lawyard Staff",
    authorAvatar: "https://secure.gravatar.com/avatar/a50d8af14e795e21996e5741d6fb78233d844f94dd598c55e69803a56c3f1d60?s=80",
    readTime: "5 MINS READ",
    sharesCount: "0 SHARES",
    content: `<p>A bill to formally integrate virtual and digital proceedings into the Judicature Act has scaled the first reading in the Nigerian Senate.</p>
<p>The bill seeks to expand the administrative capacity of appellate courts and sanction remote video testimonies for civil proceedings to expedite backlogged caseloads.</p>`
  },
  "egypt-clears-longstanding-oil-debt-to-unlock-new-energy-projects": {
    id: "grid-4",
    title: "Egypt Clears Longstanding Oil Debt to Unlock New Energy Projects",
    slug: "egypt-clears-longstanding-oil-debt-to-unlock-new-energy-projects",
    category: "NEWS",
    created_at: "2026-06-12T16:00:00.000Z",
    excerpt: "Egyptian authorities have completed payments to international energy consortiums to clear path for solar-gas hybrids.",
    featured_image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=1200",
    authorName: "Lawyard Staff",
    authorAvatar: "https://secure.gravatar.com/avatar/a50d8af14e795e21996e5741d6fb78233d844f94dd598c55e69803a56c3f1d60?s=80",
    readTime: "2 MINS READ",
    sharesCount: "0 SHARES",
    content: `<p>Egypt has completed a financial settlement plan with foreign petroleum companies, clearing debts that had delayed infrastructure investments in gas expansion.</p>
<p>The Ministry of Petroleum announced that this step will re-establish investor confidence and accelerate joint ventures in green hydrogen and natural gas exports.</p>`
  },
  "mtn-targets-nigerias-lending-market-as-it-seeks-fintech-licences": {
    id: "spotlight-2",
    title: "MTN targets Nigeria's lending market as it seeks fintech licences",
    slug: "mtn-targets-nigerias-lending-market-as-it-seeks-fintech-licences",
    category: "BLOG, LAWYARD SPOTLIGHT, NEWS",
    created_at: "2026-06-11T20:00:00.000Z",
    excerpt: "MTN targets Nigeria's lending market as it seeks fintech licences to expand digital credit solutions.",
    featured_image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80&w=1200",
    authorName: "Lawyard Staff",
    authorAvatar: "https://secure.gravatar.com/avatar/a50d8af14e795e21996e5741d6fb78233d844f94dd598c55e69803a56c3f1d60?s=80",
    readTime: "3 MINS READ",
    sharesCount: "2 SHARES",
    content: `<p>Telecoms giant MTN is seeking additional regulatory licenses in Nigeria to roll out micro-lending and insurance services through its mobile money subsidiary.</p>
<p>By leveraging its extensive mobile subscriber network, the company aims to close the credit gap for unbanked micro-enterprises across West Africa.</p>`
  },
  "texas-governor-recommends-sweeping-data-center-regulation": {
    id: "spotlight-3",
    title: "Texas Governor Recommends Sweeping Data Center Regulation",
    slug: "texas-governor-recommends-sweeping-data-center-regulation",
    category: "LAWYARD SPOTLIGHT, NEWS",
    created_at: "2026-06-11T19:00:00.000Z",
    excerpt: "Texas Governor Recommends Sweeping Data Center Regulation to manage electrical grid load and tax exceptions.",
    featured_image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=1200",
    authorName: "Lawyard Staff",
    authorAvatar: "https://secure.gravatar.com/avatar/a50d8af14e795e21996e5741d6fb78233d844f94dd598c55e69803a56c3f1d60?s=80",
    readTime: "4 MINS READ",
    sharesCount: "1 SHARE",
    content: `<p>Following warnings of potential grid overload during heatwaves, the Texas Governor has recommended new compliance mandates for high-density data centers.</p>
<p>The proposed regulations would tie state tax incentives to investments in dedicated clean energy sources and localized grid battery storage systems.</p>`
  },
  "call-for-feedback-on-the-final-draft-guidelines-for-legal-practitioners-lawyers-providing-professional-services-in-the-capital-market-in-ghana": {
    id: "spotlight-4",
    title: "Call for Feedback on the Final DRAFT GUIDELINES FOR LEGAL PRACTITIONERS/LAWYERS PROVIDING PROFESSIONAL SERVICES IN THE CAPITAL MARKET in Ghana",
    slug: "call-for-feedback-on-the-final-draft-guidelines-for-legal-practitioners-lawyers-providing-professional-services-in-the-capital-market-in-ghana",
    category: "LAWYARD SPOTLIGHT",
    created_at: "2026-06-11T18:00:00.000Z",
    excerpt: "Ghana's SEC has opened public comments on guidelines for lawyers offering services in securities trading and listing.",
    featured_image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=1200",
    authorName: "Lawyard Staff",
    authorAvatar: "https://secure.gravatar.com/avatar/a50d8af14e795e21996e5741d6fb78233d844f94dd598c55e69803a56c3f1d60?s=80",
    readTime: "5 MINS READ",
    sharesCount: "0 SHARES",
    content: `<p>The Securities and Exchange Commission (SEC) of Ghana has released its draft guidelines detailing disclosure requirements and liability profiles for capital market lawyers.</p>
<p>Members of the Ghana Bar Association and capital market stakeholders are invited to submit written comments before the upcoming August compliance deadline.</p>`
  },
  "unsafe-grounds-what-nigeria-must-learn-to-promote-stadium-safety-by-ayomide-eribake": {
    id: "sports-featured",
    title: "Unsafe Grounds: What Nigeria Must Learn to Promote Stadium Safety by Ayomide Eribake",
    slug: "unsafe-grounds-what-nigeria-must-learn-to-promote-stadium-safety-by-ayomide-eribake",
    category: "FEATURES, OPINIONS, SPORTS LAW",
    created_at: "2026-06-11T17:00:00.000Z",
    excerpt: "Examining stadium design mandates, emergency crowd management, and spectator safety regulations in domestic leagues.",
    featured_image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1200",
    authorName: "Ayomide Eribake",
    authorAvatar: "https://secure.gravatar.com/avatar/a50d8af14e795e21996e5741d6fb78233d844f94dd598c55e69803a56c3f1d60?s=80",
    readTime: "8 MINS READ",
    sharesCount: "4 SHARES",
    content: `<p>In light of recent crowd control failures in municipal matches, this article analyzes security infrastructure and crowd management standards needed for Nigerian stadiums.</p>
<p>Drawing comparative lessons from UEFA safety frameworks, the author calls for active local sports commissions to enforce stadium inspection and ticketing regulations strictly.</p>`
  },
  "cjn-approves-2025-national-judiciary-games-in-uyo-as-over-10000-athletes-set-to-compete": {
    id: "sl-1",
    title: "CJN Approves 2025 National Judiciary Games in Uyo as Over 10,000 Athletes Set to Compete",
    slug: "cjn-approves-2025-national-judiciary-games-in-uyo-as-over-10000-athletes-set-to-compete",
    category: "SPORTS LAW",
    created_at: "2025-10-30T10:00:00.000Z",
    excerpt: "The Chief Justice of Nigeria has cleared Uyo to host the multi-sport games for judiciary employees.",
    featured_image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=1200",
    authorName: "Lawyard Staff",
    authorAvatar: "https://secure.gravatar.com/avatar/a50d8af14e795e21996e5741d6fb78233d844f94dd598c55e69803a56c3f1d60?s=80",
    readTime: "1 MIN READ",
    sharesCount: "0 SHARES",
    content: `<p>The Chief Justice of Nigeria (CJN) has approved the hosting rights of Akwa Ibom State for the 2025 National Judiciary Games in Uyo.</p>
<p>Over 10,000 athletes from Federal and State judiciaries will compete across multiple tracks, fostering camaraderie and athletic development within the branch.</p>`
  },
  "football-evolution-assessing-the-creation-of-salary-caps-by-eribake-ayomide-al-ameen-sulyman": {
    id: "sl-2",
    title: "Football Evolution: Assessing the Creation of Salary Caps by Eribake Ayomide & Al-Ameen Sulyman.",
    slug: "football-evolution-assessing-the-creation-of-salary-caps-by-eribake-ayomide-al-ameen-sulyman",
    category: "SPORTS LAW",
    created_at: "2020-07-29T10:00:00.000Z",
    excerpt: "Assessing structural limits and legal battles surrounding domestic salary caps in emerging leagues.",
    featured_image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1200",
    authorName: "Eribake Ayomide",
    authorAvatar: "https://secure.gravatar.com/avatar/a50d8af14e795e21996e5741d6fb78233d844f94dd598c55e69803a56c3f1d60?s=80",
    readTime: "5 MINS READ",
    sharesCount: "2 SHARES",
    content: `<p>This comprehensive paper examines the financial structures of sports organizations and assesses whether salary caps could sustain emerging league clubs in Africa.</p>
<p>The authors analyze anti-trust laws and player union bargaining contracts to provide a legal blueprint for sustainable league expansion.</p>`
  },
  "the-need-for-a-national-dispute-resolution-chamber-in-nigeria": {
    id: "sl-3",
    title: "The Need for a National Dispute Resolution Chamber in Nigeria",
    slug: "the-need-for-a-national-dispute-resolution-chamber-in-nigeria",
    category: "SPORTS LAW",
    created_at: "2020-06-29T10:00:00.000Z",
    excerpt: "Making the case for dedicated sports arbitration tribunals to handle contract disputes inside Nigeria.",
    featured_image: "https://images.unsplash.com/photo-1505664194779-8bebcb95c02e?auto=format&fit=crop&q=80&w=1200",
    authorName: "Lawyard Staff",
    authorAvatar: "https://secure.gravatar.com/avatar/a50d8af14e795e21996e5741d6fb78233d844f94dd598c55e69803a56c3f1d60?s=80",
    readTime: "5 MINS READ",
    sharesCount: "0 SHARES",
    content: `<p>With domestic players facing unresolved contract breaches by clubs, this article details why establishing a National Dispute Resolution Chamber (NDRC) is critical.</p>
<p>Enforced by FIFA directives, a dedicated arbitration body would provide fast, independent settlements, ensuring fair wages and contractual compliance.</p>`
  }
}
