/**
 * Career paths that are real but are not standard occupations in O*NET or BLS data.
 * Values are hand-set estimates on the same scales as the generated records (see build-data.mjs).
 * Vector orders:
 *   h  = [Realistic, Investigative, Artistic, Social, Enterprising, Conventional]
 *   sv = [quant, analytic, code, science, writing, verbal, people, lead, detail, org, mech, spatial, art, perform, physical, lang, memory]
 *   v  = [income, security, impact, creativity, autonomy, prestige, variety, balance, leadership, mastery, achievement, belonging, adventure]
 *   b5 = personality demands [Openness, Conscientiousness, Extraversion, Agreeableness, Stability]
 */
const base = { g: 'ix', x: true, gr: null, se: 100, em: null, op: null, jz: null, own: 1 };
const topSkills = sv => ['quant', 'analytic', 'code', 'science', 'writing', 'verbal', 'people', 'lead', 'detail', 'org', 'mech', 'spatial', 'art', 'perform', 'physical', 'lang', 'memory']
  .map((k, i) => [k, sv[i]]).sort((a, b) => b[1] - a[1]).slice(0, 4).map(x => x[0]);
const make = c => ({ ...base, ...c, sk: topSkills(c.sv) });

export const EXTRA_CAREERS = [
  make({
    id: 'x-startup-founder', step: "Get one paying customer for a tiny product or service within 30 days.", n: 'Startup Founder',
    d: 'Build a company from an idea, raise money or bootstrap it, and own both the risk and the upside. Most startups fail; a few pay off enormously.',
    h: [0.2, 0.5, 0.5, 0.4, 1, 0.4], e: 0, ty: 0, p: 70, t: 500, ai: 0.3, rk: 0.95, hr: 0.85, st: 0.9, ph: 0.15, pp: 0.85, rm: 0.6, sx: 0.1, pc: 0.9,
    set: 'oh', fl: ['long', 'sales', 'speak'],
    sv: [0.5, 0.8, 0.4, 0.2, 0.6, 0.9, 0.7, 0.9, 0.5, 0.7, 0.1, 0.3, 0.4, 0.3, 0.1, 0.1, 0.3],
    v: [0.6, 0.1, 0.5, 0.85, 0.95, 0.6, 0.95, 0.1, 0.95, 0.6, 0.95, 0.6, 0.7],
    cz: ['tech', 'money'], emp: ['self', 'startup'], fo: 'ip', acts: ['persuade', 'strategy', 'rally', 'debate'],
    b5: [0.85, 0.6, 0.8, 0.4, 0.85], alt: ['Entrepreneur', 'Co-founder', 'Startup CEO'], rel: ['11-1011.00', '11-1021.00', '11-2022.00'],
  }),
  make({
    id: 'x-small-business-owner', step: "Work a month in the kind of business you would want to own, and ask the owner to show you the numbers.", n: 'Small Business Owner',
    d: 'Run a local business such as a cafe, gym, shop, salon or franchise. You handle customers, staff, money and everything in between.',
    h: [0.5, 0.3, 0.3, 0.6, 0.95, 0.6], e: 0, ty: 1, p: 60, t: 200, ai: 0.25, rk: 0.85, hr: 0.8, st: 0.7, ph: 0.45, pp: 0.9, rm: 0.15, sx: 0.4, pc: 0.7,
    set: 'ow', fl: ['long', 'customer', 'sales'],
    sv: [0.5, 0.6, 0.2, 0.1, 0.4, 0.7, 0.8, 0.8, 0.6, 0.85, 0.3, 0.3, 0.3, 0.2, 0.4, 0.2, 0.3],
    v: [0.5, 0.3, 0.6, 0.6, 0.9, 0.5, 0.8, 0.25, 0.85, 0.5, 0.8, 0.8, 0.4],
    cz: ['community', 'food'], emp: ['self'], fo: 'pt', acts: ['organize', 'rally', 'persuade', 'numbers'],
    b5: [0.6, 0.75, 0.75, 0.6, 0.75], alt: ['Shop owner', 'Franchise owner', 'Owner-operator'], rel: ['11-1021.00', '41-1011.00', '35-1012.00', '11-9051.00'],
  }),
  make({
    id: 'x-content-creator', step: "Post three times a week for eight weeks on one topic and track what grows.", n: 'Content Creator',
    d: 'Build an audience on video, social media, podcasts or newsletters and earn from ads, sponsors and products. Income is highly uneven; most creators earn little.',
    h: [0.2, 0.3, 0.95, 0.5, 0.85, 0.2], e: 0, ty: 0, p: 40, t: 300, ai: 0.65, rk: 0.95, hr: 0.6, st: 0.6, ph: 0.2, pp: 0.5, rm: 0.95, sx: 0.1, pc: 0.8,
    set: 'hs', fl: ['sales', 'speak'],
    sv: [0.2, 0.4, 0.3, 0.1, 0.7, 0.9, 0.6, 0.3, 0.5, 0.6, 0.2, 0.5, 0.85, 0.8, 0.2, 0.2, 0.3],
    v: [0.45, 0.1, 0.4, 0.95, 0.95, 0.6, 0.85, 0.4, 0.3, 0.4, 0.8, 0.3, 0.6],
    cz: ['arts', 'tech'], emp: ['self', 'free'], fo: 'ip', acts: ['perform', 'beauty', 'write', 'persuade'],
    b5: [0.9, 0.55, 0.85, 0.4, 0.6], alt: ['YouTuber', 'Streamer', 'Influencer', 'Podcaster', 'Newsletter writer'], rel: ['27-3043.00', '27-4032.00', '27-3031.00', '27-1024.00'],
  }),
  make({
    id: 'x-real-estate-investor', step: "Analyze ten local rental listings with a simple cash-flow spreadsheet before buying anything.", n: 'Real Estate Investor',
    d: 'Buy, renovate, rent or sell property for profit. Returns depend on capital, financing, local markets and a lot of negotiation.',
    h: [0.4, 0.5, 0.2, 0.3, 0.9, 0.7], e: 0, ty: 2, p: 60, t: 250, ai: 0.3, rk: 0.85, hr: 0.5, st: 0.6, ph: 0.3, pp: 0.6, rm: 0.4, sx: 0.4, pc: 0.5,
    set: 'rf', fl: ['sales'],
    sv: [0.75, 0.7, 0.2, 0, 0.3, 0.7, 0.6, 0.5, 0.6, 0.7, 0.4, 0.4, 0.2, 0, 0.3, 0.1, 0.3],
    v: [0.65, 0.3, 0.3, 0.4, 0.95, 0.55, 0.7, 0.6, 0.6, 0.5, 0.8, 0.3, 0.5],
    cz: ['cities', 'money'], emp: ['self'], fo: 'dp', acts: ['numbers', 'persuade', 'strategy', 'debate'],
    b5: [0.55, 0.7, 0.6, 0.4, 0.7], alt: ['Property investor', 'Landlord', 'House flipper'], rel: ['41-9022.00', '41-9021.00', '11-9141.00'],
  }),
  make({
    id: 'x-freelance-consultant', step: "Land one small paid project from your network and deliver it end to end.", n: 'Freelance Consultant',
    d: 'Sell your expertise to several clients on contract instead of working for one employer. Usually built on years of experience in a field.',
    h: [0.1, 0.7, 0.4, 0.5, 0.8, 0.5], e: 3, ty: 7, p: 90, t: 220, ai: 0.55, rk: 0.7, hr: 0.45, st: 0.55, ph: 0.05, pp: 0.7, rm: 0.9, sx: 0.2, pc: 0.6,
    set: 'ho', fl: ['sales', 'desk'],
    sv: [0.6, 0.9, 0.3, 0.2, 0.8, 0.85, 0.7, 0.4, 0.6, 0.7, 0, 0.2, 0.3, 0.2, 0, 0.2, 0.3],
    v: [0.7, 0.3, 0.5, 0.6, 0.95, 0.6, 0.85, 0.6, 0.4, 0.85, 0.75, 0.3, 0.4],
    cz: ['money', 'tech'], emp: ['self', 'free'], fo: 'ip', acts: ['strategy', 'write', 'debate', 'research'],
    b5: [0.8, 0.7, 0.6, 0.5, 0.7], alt: ['Independent consultant', 'Freelancer', 'Fractional executive'], rel: ['13-1111.00', '11-1021.00', '13-1161.00'],
  }),
  make({
    id: 'x-independent-trader', step: "Paper-trade a written strategy for three months and journal every decision before risking real money.", n: 'Independent Trader',
    d: 'Trade stocks, futures or crypto with your own or a firm’s capital. Most independent traders lose money; a small minority earn a living.',
    h: [0.1, 0.9, 0.2, 0.1, 0.8, 0.7], e: 0, ty: 2, p: 50, t: 400, ai: 0.7, rk: 1, hr: 0.5, st: 0.9, ph: 0.05, pp: 0.1, rm: 1, sx: 0.3, pc: 0.9,
    set: 'h', fl: ['math', 'desk'],
    sv: [0.9, 0.9, 0.5, 0.2, 0.2, 0.2, 0.2, 0.1, 0.8, 0.6, 0, 0.3, 0, 0, 0, 0, 0.4],
    v: [0.55, 0.05, 0.1, 0.4, 1, 0.4, 0.6, 0.5, 0.1, 0.8, 0.9, 0.1, 0.6],
    cz: ['money'], emp: ['self'], fo: 'di', acts: ['numbers', 'research', 'strategy', 'code'],
    b5: [0.7, 0.85, 0.2, 0.3, 0.9], alt: ['Day trader', 'Prop trader', 'Independent investor'], rel: ['13-2051.00', '41-3031.00'],
  }),
];
