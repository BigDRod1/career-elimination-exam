/* Reference data and exam definition. Shared by the browser app and the tests. */

export const REPO_URL = 'https://github.com/BigDRod1/career-elimination-exam';
export const REPO_API = 'https://api.github.com/repos/BigDRod1/career-elimination-exam';

export const GROUPS = {
  '11': 'Management', '13': 'Business & Finance', '15': 'Computers & Math', '17': 'Engineering & Architecture', '19': 'Science',
  '21': 'Community & Social Service', '23': 'Legal', '25': 'Education & Libraries', '27': 'Arts, Media & Sports',
  '29': 'Healthcare Practitioners', '31': 'Healthcare Support', '33': 'Protective Service', '35': 'Food Service',
  '37': 'Building & Grounds', '39': 'Personal Care & Service', '41': 'Sales', '43': 'Office & Admin Support',
  '45': 'Farming, Fishing & Forestry', '47': 'Construction & Extraction', '49': 'Installation & Repair',
  '51': 'Production & Manufacturing', '53': 'Transportation & Moving', 'ix': 'Independent & Entrepreneurial'
};

export const RIASEC = [
  { k: 'R', n: 'Realistic', d: 'Hands-on and practical; tools, machines, the physical world', love: 'Hands-on, practical work' },
  { k: 'I', n: 'Investigative', d: 'Analytical and curious; ideas, data, figuring things out', love: 'Analyzing and figuring things out' },
  { k: 'A', n: 'Artistic', d: 'Expressive and original; creating, designing, performing', love: 'Creating and expressing' },
  { k: 'S', n: 'Social', d: 'Helping, teaching and caring for people', love: 'Helping and teaching people' },
  { k: 'E', n: 'Enterprising', d: 'Persuading, leading, competing and taking risks', love: 'Leading and persuading' },
  { k: 'C', n: 'Conventional', d: 'Organizing, precise, comfortable with clear systems', love: 'Organizing and precise work' }
];

export const ARCH = {
  RI: ['The Engineer', 'You want to understand how things work, then make them work better.'],
  RA: ['The Maker', 'You want to build things with your hands that also look and feel right.'],
  RS: ['The Hands-on Helper', 'You help people in practical, physical ways rather than with talk.'],
  RE: ['The Builder-Boss', 'You like tangible work and being the one who runs the job.'],
  RC: ['The Technician', 'You value precision, reliable systems and doing the job right.'],
  IR: ['The Applied Scientist', 'You chase answers, then want to see them work in the real world.'],
  IA: ['The Inventor', 'You mix rigorous thinking with a drive to create something new.'],
  IS: ['The Healer-Scientist', 'You want to understand problems deeply so you can help people with them.'],
  IE: ['The Strategist', 'You analyze the board, then want to make the winning move.'],
  IC: ['The Analyst', 'You find patterns in data and trust careful, structured reasoning.'],
  AR: ['The Craftsperson', 'Your creativity comes out through materials, tools and physical work.'],
  AI: ['The Visionary', 'You generate original ideas and like to think them all the way through.'],
  AS: ['The Storyteller', 'You create to connect with people, teach them or move them.'],
  AE: ['The Creative Entrepreneur', 'You want your ideas to reach an audience and pay off.'],
  AC: ['The Designer', 'You bring order and polish to creative work.'],
  SR: ['The Caregiver', 'You show up for people in concrete, practical ways.'],
  SI: ['The Counselor', 'You want to understand people deeply and help them change.'],
  SA: ['The Mentor', 'You help people grow through teaching, coaching and expression.'],
  SE: ['The Advocate', 'You rally people and resources around a cause.'],
  SC: ['The Steward', 'You keep the systems that support people running well.'],
  ER: ['The Operator', 'You like running real-world operations and making them win.'],
  EI: ['The Founder', 'You pair ambition with analysis and want to build and lead something.'],
  EA: ['The Promoter', 'You sell ideas, stories and brands with flair.'],
  ES: ['The Leader', 'You motivate people and like being responsible for the team.'],
  EC: ['The Executive', 'You like to lead through plans, numbers and accountability.'],
  CR: ['The Precisionist', 'You like exact, reliable work where quality is measurable.'],
  CI: ['The Auditor', 'You like rigorous checking, clear rules and getting the numbers right.'],
  CA: ['The Editor', 'You bring structure and polish to creative or written work.'],
  CS: ['The Coordinator', 'You keep people organized and things moving smoothly.'],
  CE: ['The Manager', 'You run organized systems and like being accountable for results.']
};

export const FLAGS = [
  ['blood', 'Blood, needles or bodily fluids'], ['death', 'Death and grieving families'], ['trauma', 'Trauma, crime or violence up close'],
  ['sales', 'Sales targets or cold-calling'], ['commission', 'Commission-based pay'], ['speak', 'Regular public speaking'],
  ['night', 'Night, overnight or rotating shifts'], ['oncall', 'Being on call'], ['travel', 'Frequent travel'],
  ['danger', 'Physical danger or injury risk'], ['long', 'Long hours as the norm'], ['kids', 'Working with children all day'],
  ['animals', 'Hands-on work with animals'], ['weather', 'Working outside in all weather'], ['conflict', 'Frequent conflict or angry people'],
  ['uniform', 'Uniforms and a chain of command'], ['lab', 'Lab bench work'], ['math', 'Heavy math every day'],
  ['code', 'Writing code every day'], ['writing', 'Writing most of the day'], ['desk', 'Sitting at a computer all day'],
  ['customer', 'Customer service all day'], ['dirty', 'Dirty or contaminated conditions'], ['heights', 'Heights or cramped spaces'],
  ['lifting', 'Heavy lifting and manual labor'], ['license', 'A licensing exam or certification'], ['politics', 'Politics and public scrutiny']
];
export const FLAG_LABEL = Object.fromEntries(FLAGS);
FLAG_LABEL.relocate = 'Few jobs, often concentrated in certain places';

export const SKILLS = [
  ['quant', 'Math and numbers', 'Algebra, statistics, mental math'],
  ['analytic', 'Logical problem solving', 'Breaking complex problems into parts'],
  ['code', 'Programming and tech tools', 'Code, spreadsheets, software'],
  ['science', 'Science knowledge', 'Biology, chemistry, physics'],
  ['writing', 'Writing', 'Clear, persuasive written work'],
  ['verbal', 'Speaking and persuading', 'Explaining, presenting, convincing'],
  ['people', 'Reading people and empathy', 'Sensing what others feel and need'],
  ['lead', 'Leading people', 'Getting a group to act'],
  ['detail', 'Precision and detail', 'Catching errors, exact work'],
  ['org', 'Planning and organization', 'Schedules, systems, follow-through'],
  ['mech', 'Mechanical and hands-on', 'Tools, repairs, how machines work'],
  ['spatial', 'Spatial and visual thinking', 'Picturing objects, maps and layouts'],
  ['art', 'Artistic and design sense', 'Color, composition, style'],
  ['perform', 'Performing', 'Music, acting, being on stage'],
  ['physical', 'Physical fitness and stamina', 'Strength, endurance, coordination'],
  ['lang', 'Foreign languages', 'Speaking or learning other languages'],
  ['memory', 'Memorizing large amounts', 'Facts, terms, procedures']
];
export const SKILL_KEYS = SKILLS.map(s => s[0]);
export const SKILL_LABEL = Object.fromEntries(SKILLS.map(s => [s[0], s[1]]));

export const VALUES = [
  ['income', 'High income'], ['security', 'Job security and stability'], ['impact', 'Helping people and making a difference'],
  ['creativity', 'Creative expression'], ['autonomy', 'Independence and control of my time'], ['prestige', 'Status and respect'],
  ['variety', 'Variety, no two days alike'], ['balance', 'Work-life balance'], ['leadership', 'Authority and leading others'],
  ['mastery', 'Becoming a deep expert'], ['achievement', 'Visible results and winning'], ['belonging', 'A close team and belonging'],
  ['adventure', 'Adventure, travel and excitement']
];
export const VALUE_KEYS = VALUES.map(v => v[0]);
export const VAL_LABEL = Object.fromEntries(VALUES);

export const CAUSES = [
  ['health', 'Health and medicine'], ['edu', 'Education and youth'], ['env', 'Environment and climate'], ['tech', 'Technology and AI'],
  ['money', 'Money and markets'], ['justice', 'Justice and rights'], ['arts', 'Arts and culture'], ['community', 'Community and poverty'],
  ['science', 'Science and discovery'], ['animals', 'Animals'], ['sports', 'Sports and fitness'], ['food', 'Food and agriculture'],
  ['cities', 'Housing, cities and infrastructure'], ['defense', 'Security and defense'], ['space', 'Space and aviation']
];
export const CAUSE_LABEL = Object.fromEntries(CAUSES);
export const EMPLOYERS = [['corp', 'Large company'], ['startup', 'Startup'], ['gov', 'Government'], ['nonprofit', 'Nonprofit'], ['inst', 'Hospital or school'], ['self', 'My own business'], ['mil', 'Military'], ['acad', 'University or research lab'], ['free', 'Freelance']];
export const SETTINGS = [['o', 'Office'], ['h', 'Home or remote'], ['x', 'Outdoors'], ['l', 'Lab, clinic or hospital'], ['w', 'Workshop, kitchen or job site'], ['r', 'On the road'], ['s', 'Stage or studio'], ['k', 'Classroom'], ['f', 'Out in the community']];
export const SETTING_LABEL = Object.fromEntries(SETTINGS);
export const FOCUS = [['d', 'Data and numbers'], ['i', 'Ideas and theories'], ['p', 'People'], ['t', 'Things and tools']];
export const ACTS = [
  ['debate', 'Debating and arguing a position'], ['fix', 'Fixing something that is broken'], ['beauty', 'Making things look beautiful'],
  ['teach', 'Explaining something until it clicks'], ['organize', 'Turning chaos into order'], ['numbers', 'Crunching numbers'],
  ['write', 'Writing'], ['perform', 'Performing in front of people'], ['build', 'Building things with your hands'],
  ['research', 'Going down research rabbit holes'], ['comfort', 'Comforting someone who is struggling'], ['persuade', 'Selling or persuading'],
  ['strategy', 'Planning strategy several moves ahead'], ['code', 'Coding or tinkering with tech'], ['outdoors', 'Being outdoors and moving'],
  ['rally', 'Rallying a group toward a goal']
];
export const ACT_LABEL = Object.fromEntries(ACTS);

export const FIELDS = [['bus', 'Business, finance or economics'], ['stem', 'Engineering or physical science'], ['cs', 'Computer science or IT'], ['health', 'Health or biology'], ['soc', 'Psychology or social science'], ['hum', 'Humanities, writing or languages'], ['arts', 'Art, design or music'], ['edu', 'Education'], ['comm', 'Communications or media'], ['trades', 'Trades or technical training'], ['und', 'Undecided or none yet']];
export const FIELD_GROUPS = { bus: ['11', '13', '41', '43', 'ix'], stem: ['17', '19', '15'], cs: ['15'], health: ['29', '31', '19'], soc: ['21', '19', '23', '25'], hum: ['27', '23', '25'], arts: ['27'], edu: ['25', '21'], comm: ['27', '41', '11'], trades: ['47', '49', '51', '53'], und: [] };
export const SUCCESS = [['wealth', 'Wealthy and financially free'], ['expert', 'A respected expert at the top of my field'], ['built', 'Built something of my own'], ['difference', 'Made a real difference for people'], ['creative', 'Known for creative work'], ['family', 'A strong family life and lots of free time'], ['adventure', 'Lived an adventurous life in many places'], ['lead', 'Leading a large organization']];
export const REGRETS = [['safe', 'Playing it safe'], ['money', 'Not making enough money'], ['help', 'Not helping enough people'], ['create', 'Not creating something that lasts'], ['people', 'Not spending enough time with people I love'], ['mastery', 'Never getting truly great at one thing']];

export const EDU_REQ = ['no formal degree', 'a short certificate or some college', 'a 2-year degree or apprenticeship', "a bachelor's degree", "a master's degree", 'a doctorate or professional degree'];
export const EDU_SHORT = ['None', 'Certificate', '2-year', "Bachelor's", "Master's", 'Doctorate'];
export const EDU_HELD = ['high school', 'a short certificate', 'a 2-year degree', "a bachelor's degree", "a master's degree", 'a doctorate'];
export const CUR_YEARS = [0, 1.5, 2, 4, 6, 9];
export const RUNWAY_Y = [0, 0.5, 1, 3, 6];
export const TIME_MAX = [1, 2.5, 4.5, 99];
export const COMPS = [['interest', 'Interests', 24], ['values', 'Values', 16], ['env', 'Work style', 14], ['skills', 'Strengths', 12], ['personality', 'Personality', 10], ['meaning', 'Life goals', 10], ['energy', 'Energy', 8], ['outlook', 'Outlook', 6]];

export const growthLabel = gr => gr == null ? 'No projection' : gr >= 8 ? 'Much faster than average' : gr >= 5 ? 'Faster than average' : gr >= 2 ? 'About average' : gr >= -1 ? 'Little or no change' : 'Declining';
export const level4 = x => x < 0.25 ? 'Low' : x < 0.5 ? 'Moderate' : x < 0.75 ? 'High' : 'Very high';
export const riskLabel = x => x < 0.2 ? 'Steady' : x < 0.4 ? 'Mostly steady' : x < 0.65 ? 'Variable' : 'Highly variable';
export const remoteLabel = x => x < 0.3 ? 'In person' : x < 0.6 ? 'Some remote' : 'Remote-friendly';
export const hoursBucket = hr => hr < 0.25 ? 0 : hr < 0.5 ? 1 : hr < 0.75 ? 2 : 3;

/** Turns "Cooks, Restaurant" into "Restaurant Cooks" for use inside sentences. */
export function plainTitle(t) {
  let s = t.replace(/, All Other$/, '').replace(/\s*\(.*?\)\s*/g, ' ').trim();
  if (/, Except/.test(s)) return s.split(',')[0];
  const parts = s.split(', ');
  if (parts.length === 2 && parts[1].split(' ').length <= 3 && !/ and /.test(parts[1])) return parts[1] + ' ' + parts[0];
  return parts[0];
}
const lower = t => plainTitle(t).toLowerCase();
export const STEP_BY_GROUP = {
  '11': t => `Ask two ${lower(t)} how they got there, then lead one real project where you own a budget or a team.`,
  '13': t => `Ask two ${lower(t)} what a normal week looks like, and build one spreadsheet model like the ones they use.`,
  '15': t => `Ask two ${lower(t)} about their work, and build one small project with the tools they use.`,
  '17': t => `Ask two ${lower(t)} about their projects, and design or build one small thing with CAD or by hand.`,
  '19': t => `Email two ${lower(t)} or professors in the field and ask to help with real research for a semester.`,
  '21': t => `Volunteer weekly where ${lower(t)} work, and ask one of them how licensing works.`,
  '23': t => `Sit in on a court session and ask two ${lower(t)} what the work is really like.`,
  '25': t => `Tutor, coach or substitute-teach for a few weeks, and talk to two ${lower(t)}.`,
  '27': t => `Make and publish one piece of work in this field this month, then get feedback from two ${lower(t)}.`,
  '29': t => `Shadow ${lower(t)} for a day and log volunteer hours in a clinic or hospital.`,
  '31': t => `Volunteer in a care setting and compare short certificate programs for ${lower(t)}.`,
  '33': t => `Attend a ride-along or open house with local ${lower(t)} and check the physical and background requirements.`,
  '35': () => 'Work a few real shifts in a kitchen or restaurant.',
  '37': () => 'Spend a weekend doing the work yourself, or help a local crew for a few days.',
  '39': t => `Shadow ${lower(t)} for a few shifts and look up the licensing rules in your state.`,
  '41': t => `Sell something real this month and ask two ${lower(t)} how they get paid.`,
  '43': t => `Take a temp or part-time role to see the day-to-day, and learn the software ${lower(t)} use.`,
  '45': () => 'Work a season outdoors on a farm, crew or boat.',
  '47': t => `Help on a job site for a week and look up local apprenticeship programs for ${lower(t)}.`,
  '49': () => 'Fix something real with a mentor and look up apprenticeships or certificate programs.',
  '51': () => 'Tour a local plant and ask about entry-level roles and on-the-job training.',
  '53': t => `Ride along with ${lower(t)} and compare the license or certificate programs.`
};
export const stepFor = c => c.step || (STEP_BY_GROUP[c.g] ? STEP_BY_GROUP[c.g](c.n) : 'Talk to two people who do this work this month.');
export const PLAN90 = {
  '11': 'Take on a leadership role with real accountability: a club, a team or a project at work.',
  '13': 'Build models, follow the industry and network toward an internship or analyst role.',
  '15': 'Ship two small portfolio projects and talk to three people who do this job.',
  '17': 'Join a design team or club build and learn one CAD or simulation tool well.',
  '19': 'Get into a research lab and contribute to one real experiment or analysis.',
  '21': 'Volunteer weekly in a helping role and map the degree and license you would need.',
  '23': 'Get inside the system: intern or volunteer at a court, firm, agency or clinic.',
  '25': 'Tutor, coach or teach every week so you know how the work feels day to day.',
  '27': 'Make work every week and publish a portfolio other people can see.',
  '29': 'Log 50+ hours of patient-facing volunteering or shadowing to confirm the fit.',
  '31': 'Finish a short certificate or start an entry role in a care setting.',
  '33': 'Meet the physical, background and training requirements and talk to working officers.',
  '35': 'Work real shifts in the setting and find a mentor a few years ahead of you.',
  '37': 'Work with a crew for a season and learn what it takes to run your own.',
  '39': 'Work real shifts in the setting and complete any required license hours.',
  '41': 'Sell every week and track your numbers so you learn what works.',
  '43': 'Get hands-on with the software and land a part-time or temp role.',
  '45': 'Spend a season doing field work on a farm, crew or boat.',
  '47': 'Get hands-on with a pre-apprenticeship, shop class or summer helper job.',
  '49': 'Get hands-on with a pre-apprenticeship, certificate course or helper job.',
  '51': 'Land an entry role with on-the-job training and learn one machine or process well.',
  '53': 'Get the first license or certificate and talk to working professionals.',
  'ix': 'Launch a tiny version and get paid by a real customer within 90 days.'
};

/* ---------------- exam ---------------- */
export const SCALES = {
  agree: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'],
  enjoy: ['Hate it', 'Dislike it', 'Neutral', 'Like it', 'Love it'],
  skill: ['Weak', 'Below average', 'Average', 'Strong', 'Exceptional'],
  imp: ['Not important', 'Slightly important', 'Moderately important', 'Very important', 'Essential']
};
export const B5 = [
  ['O1', 'O', 0, 'I get excited by new ideas, even impractical ones.'],
  ['C1', 'C', 0, 'I finish tasks well before the deadline.'],
  ['E1', 'E', 0, 'Spending time with a big group leaves me energized.'],
  ['A1', 'A', 0, 'I go out of my way to help people, even when it costs me.'],
  ['S1', 'S', 0, 'I stay calm under pressure.'],
  ['O2', 'O', 1, 'I prefer familiar routines to trying new things.'],
  ['C2', 'C', 1, 'I often leave things messy or half-finished.'],
  ['E2', 'E', 1, 'I prefer to stay in the background.'],
  ['A2', 'A', 1, 'I enjoy debating and winning arguments.'],
  ['S2', 'S', 1, 'I worry a lot about things that might go wrong.'],
  ['O3', 'O', 0, 'I enjoy thinking about abstract or philosophical questions.'],
  ['C3', 'C', 0, 'I make plans and actually stick to them.'],
  ['E3', 'E', 0, 'I start conversations with strangers easily.'],
  ['A3', 'A', 0, 'I trust people until they give me a reason not to.'],
  ['S3', 'S', 1, 'My mood can change quickly.'],
  ['O4', 'O', 0, 'I notice beauty in art, music or design that others walk past.'],
  ['C4', 'C', 0, 'I catch small mistakes other people miss.'],
  ['E4', 'E', 1, "I'd rather spend a free evening alone than at a party."],
  ['A4', 'A', 0, "Other people's problems genuinely affect me."],
  ['S4', 'S', 0, 'Criticism rolls off me pretty quickly.']
];
const RI_ITEMS = {
  R: ['Fix or rebuild an engine or machine', 'Build furniture or a structure with your hands', 'Work outdoors on land, water or a job site', 'Operate heavy equipment, vehicles or power tools', 'Install wiring, plumbing or computer hardware'],
  I: ['Run an experiment to test a hypothesis', 'Analyze a dataset to find a hidden pattern', 'Figure out why a disease or system works the way it does', 'Read research in a field you care about', 'Solve hard math or logic puzzles'],
  A: ['Write a story, script or song', 'Design a logo, a room or the look of a product', 'Perform on stage or on camera', 'Shoot and edit photos or video', 'Invent something that has never existed'],
  S: ["Teach a skill to someone who's struggling", "Listen to someone's problems and help them through it", 'Care for someone who is sick or injured', 'Coach a team or mentor a young person', 'Organize a community or volunteer project'],
  E: ['Pitch an idea and convince people to back it', 'Start and run your own business', 'Negotiate a deal', 'Lead a team toward a big goal', 'Compete for rankings, promotions or market share'],
  C: ['Organize files, budgets or records into a clean system', 'Check documents for errors and rule-breaking', 'Build a detailed spreadsheet or schedule', 'Follow a precise procedure exactly', 'Manage inventory, logistics or data entry']
};
const riQs = [];
for (let i = 0; i < 5; i++) for (const L of 'RIASEC') riQs.push({ k: `r.${L}${i + 1}`, t: 'likert', s: 'enjoy', q: RI_ITEMS[L][i] });

export const PARTS = [
  { id: 'ctx', title: 'Where you stand', short: 'Situation', intro: 'Your starting point sets hard limits: how much more school is realistic, how soon you need a salary and whether you can move.', meta: ['Sets hard limits'], qs: [
    { k: 'ctx.stage', t: 'single', q: 'Where are you in life right now?', o: [['hs', 'High school'], ['col', 'In college'], ['grad', 'Recently graduated'], ['early', 'Early career, 1 to 5 years'], ['mid', 'Mid-career, 5+ years'], ['change', 'Changing careers'], ['return', 'Returning to work']] },
    { k: 'ctx.edu', t: 'single', q: 'Highest education you have completed', o: [['0', 'High school or GED'], ['1', 'Some college'], ['2', 'Associate degree or trade certificate'], ['3', "Bachelor's degree"], ['4', "Master's degree"], ['5', 'Doctorate or professional degree']] },
    { k: 'ctx.field', t: 'multi', max: 2, q: 'What have you studied, or plan to study?', hint: 'Pick up to 2.', o: FIELDS },
    { k: 'ctx.build', t: 'single', q: 'How much do you want to build on what you have studied?', o: [['0', 'Starting fresh is fine'], ['1', "I'd like to use it"], ['2', 'I want to build directly on it']] },
    { k: 'ctx.runway', t: 'single', q: 'How long could you support yourself while training for a new career?', o: [['0', 'I need income now'], ['1', 'Under 6 months'], ['2', '6 to 12 months'], ['3', '1 to 3 years'], ['4', '3+ years, or I am still in school']] },
    { k: 'ctx.time', t: 'single', q: 'How soon do you need to be earning a full salary?', o: [['0', 'Within 6 months'], ['1', 'Within 1 to 2 years'], ['2', 'Within 2 to 4 years'], ['3', 'I can invest 5+ years']] },
    { k: 'ctx.loc', t: 'single', q: 'How far would you move for the right career?', o: [['0', 'I need to stay where I live'], ['1', 'Within my region'], ['2', 'Anywhere in the country'], ['3', 'Anywhere in the world']] }
  ] },
  { id: 'big5', title: 'Personality', short: 'Personality', intro: 'Twenty statements about how you tend to act. Answer for how you usually are, not how you would like to be.', meta: ['Big Five model', 'Matched against O*NET work styles'], qs: B5.map(b => ({ k: 'b.' + b[0], t: 'likert', s: 'agree', q: b[3] })) },
  { id: 'riasec', title: 'Interests', short: 'Interests', intro: 'How much would you enjoy each activity? Ignore pay, training and whether you would be good at it. This part carries the most weight.', meta: ['Holland codes (RIASEC)', 'The same model O*NET uses for every occupation'], qs: riQs },
  { id: 'skills', title: 'Strengths', short: 'Strengths', intro: 'Rate yourself against people your age. Skills can be learned, so this counts less than your interests and values.', meta: ['Matched against O*NET skill importance'], qs: SKILLS.map(s => ({ k: 's.' + s[0], t: 'likert', s: 'skill', q: s[1], hint: s[2] })) },
  { id: 'values', title: 'Values', short: 'Values', intro: 'How important is each of these in your working life? Then pick the three you will not compromise on.', meta: ['Must-haves are penalized when missing'], qs: VALUES.map(v => ({ k: 'v.' + v[0], t: 'likert', s: 'imp', q: v[1] })).concat([{ k: 'v.must', t: 'multi', max: 3, q: 'Your three must-haves', hint: 'Careers that are weak on these lose points.', o: VALUES }]) },
  { id: 'work', title: 'Work style', short: 'Work style', intro: 'The day-to-day shape of the work you want.', meta: ['Environment, pace, schedule'], qs: [
    { k: 'w.setting', t: 'multi', max: 3, q: 'Where would you most like to spend your workday?', hint: 'Pick up to 3.', o: SETTINGS },
    { k: 'w.people', t: 'scale', q: 'How much contact with people do you want?', ends: ['Mostly alone', 'With people all day'] },
    { k: 'w.structure', t: 'scale', q: 'How much structure do you want?', ends: ['Figure it out as I go', 'Clear rules and routines'] },
    { k: 'w.pace', t: 'scale', q: 'What pace suits you?', ends: ['Calm and steady', 'Fast and high-pressure'] },
    { k: 'w.physical', t: 'scale', q: 'How physical should your work be?', ends: ['At a desk', 'On my feet, moving'] },
    { k: 'w.remote', t: 'single', q: 'Working from home', o: [['need', 'I need fully remote'], ['prefer', 'I prefer remote'], ['hybrid', 'Hybrid is ideal'], ['inperson', 'I prefer in person'], ['any', 'No preference']] },
    { k: 'w.hours', t: 'single', q: 'Most hours per week you would work long term', o: [['0', 'Under 40'], ['1', 'About 40'], ['2', '45 to 50'], ['3', '50 to 60 if it pays off'], ['4', 'Whatever it takes']] },
    { k: 'w.sched', t: 'single', q: 'Which schedules work for you?', o: [['day', 'Weekday daytime only'], ['eve', 'Some evenings or weekends'], ['shift', 'Shifts and nights are fine'], ['any', 'Totally irregular is fine']] },
    { k: 'w.emp', t: 'multi', max: 3, q: 'What kind of employer appeals to you?', hint: 'Pick up to 3.', none: 'No preference', o: EMPLOYERS },
    { k: 'w.role', t: 'single', q: 'Long term, which role do you want?', o: [['ic', 'Individual expert'], ['mgr', 'Manager of people'], ['own', 'Owner or founder'], ['unsure', 'Not sure yet']] },
    { k: 'w.focus', t: 'multi', max: 2, q: 'What would you rather work with most?', hint: 'Pick up to 2.', o: FOCUS }
  ] },
  { id: 'deal', title: 'Dealbreakers', short: 'Dealbreakers', intro: 'Anything you tick here crosses careers off immediately. Only tick things you truly refuse to do for years.', meta: ['Instant eliminations'], qs: [
    { k: 'd.flags', t: 'multi', flag: true, q: 'Which of these would you refuse to do regularly?', hint: 'Tick every true dealbreaker.', none: 'None of these', o: FLAGS },
    { k: 'd.edu', t: 'single', q: 'The most education you are willing to complete', o: [['0', 'No more school'], ['1', 'A short certificate'], ['2', 'A 2-year degree or apprenticeship'], ['3', "A bachelor's degree"], ['4', "A master's degree"], ['5', 'A doctorate, MD or law degree']] },
    { k: 'd.income', t: 'single', q: 'Within 10 years, the least you need to earn per year', o: [['0', 'Money is not a constraint'], ['35', '$35k'], ['50', '$50k'], ['70', '$70k'], ['90', '$90k'], ['120', '$120k'], ['150', '$150k or more']] },
    { k: 'd.risk', t: 'single', q: 'How do you feel about income that swings from year to year?', o: [['0', 'Unacceptable, I need steady pay'], ['1', 'Some ups and downs are fine'], ['2', 'Fine if the upside is big'], ['3', 'I am drawn to high risk, high reward']] },
    { k: 'd.ai', t: 'likert', s: 'agree', q: 'I worry about AI and automation replacing jobs.' }
  ] },
  { id: 'life', title: 'Life and meaning', short: 'Life goals', intro: 'What you want your life to add up to, beyond the job title.', meta: ['Purpose, legacy, lifestyle'], qs: [
    { k: 'l.success', t: 'multi', max: 2, q: 'At 45, what would make you feel successful?', hint: 'Pick up to 2.', o: SUCCESS },
    { k: 'l.causes', t: 'multi', max: 3, q: 'Which areas do you care most about?', hint: 'Pick up to 3.', none: 'None in particular', o: CAUSES },
    { k: 'l.meaning', t: 'likert', s: 'agree', q: "I'd take a 30% pay cut for work that feels meaningful." },
    { k: 'l.visible', t: 'likert', s: 'agree', q: 'I want my work to be seen and recognized by a lot of people.' },
    { k: 'l.ownbiz', t: 'likert', s: 'agree', q: "I'd rather own a small business than be a VP at a big company." },
    { k: 'l.family', t: 'likert', s: 'agree', q: 'I want a schedule that leaves real room for family and friends.' },
    { k: 'l.regret', t: 'single', q: 'At 80, which would you regret most?', o: REGRETS }
  ] },
  { id: 'energy', title: 'Energy audit', short: 'Energy', intro: 'Think of moments when time disappeared, and moments that left you drained.', meta: ['Flow and burnout signals'], qs: [
    { k: 'e.on', t: 'multi', max: 4, q: 'Which activities make you lose track of time?', hint: 'Pick up to 4.', o: ACTS },
    { k: 'e.off', t: 'multi', max: 4, q: 'Which activities drain you fastest?', hint: 'Pick up to 4.', none: 'None of these', o: ACTS }
  ] },
  { id: 'gut', title: 'Gut check', short: 'Gut check', special: 'gut', intro: 'Your top remaining careers. Keep the ones that excite you and cross off the ones that do not, even if the numbers like them.', meta: ['You make the cuts'] },
  { id: 'duel', title: 'Showdown', short: 'Showdown', special: 'duel', intro: 'Head-to-head picks between your top careers. Go with your first instinct; the winner gets a boost in your results.', meta: ['Bracket of up to 8'] }
];
export const QMAP = {};
PARTS.forEach((p, pi) => (p.qs || []).forEach(q => { q.part = pi; QMAP[q.k] = q; }));
export const QCOUNT = Object.keys(QMAP).length;

/** Example answers: a curious, people-oriented planner interested in health and education. */
export function sampleAnswers() {
  const a = { 'ctx.stage': 'col', 'ctx.edu': '1', 'ctx.field': ['health', 'soc'], 'ctx.build': '1', 'ctx.runway': '4', 'ctx.time': '2', 'ctx.loc': '2' };
  const b5 = { O: 4, C: 4, E: 3, A: 4, S: 3 }, wig = [0, 1, 0, -1];
  B5.forEach(([id, T, rev], i) => { const v = Math.max(1, Math.min(5, b5[T] + wig[i % 4])); a['b.' + id] = rev ? 6 - v : v; });
  const ri = { R: 2, I: 4, A: 3, S: 5, E: 2, C: 3 }, w2 = [0, 1, -1, 0, 0];
  for (const L of 'RIASEC') for (let i = 1; i <= 5; i++) a[`r.${L}${i}`] = Math.max(1, Math.min(5, ri[L] + w2[(i + L.charCodeAt(0)) % 5]));
  Object.entries({ quant: 3, analytic: 4, code: 2, science: 4, writing: 3, verbal: 4, people: 5, lead: 3, detail: 4, org: 4, mech: 2, spatial: 3, art: 3, perform: 2, physical: 3, lang: 2, memory: 4 }).forEach(([k, v]) => { a['s.' + k] = v; });
  Object.entries({ income: 3, security: 4, impact: 5, creativity: 3, autonomy: 3, prestige: 2, variety: 3, balance: 4, leadership: 2, mastery: 4, achievement: 3, belonging: 4, adventure: 2 }).forEach(([k, v]) => { a['v.' + k] = v; });
  a['v.must'] = ['impact', 'balance', 'security'];
  Object.assign(a, { 'w.setting': ['l', 'k', 'o'], 'w.people': 4, 'w.structure': 3, 'w.pace': 3, 'w.physical': 3, 'w.remote': 'hybrid', 'w.hours': '1', 'w.sched': 'eve', 'w.emp': ['inst', 'nonprofit', 'gov'], 'w.role': 'ic', 'w.focus': ['p', 'i'] });
  Object.assign(a, { 'd.flags': ['sales', 'commission', 'uniform', 'danger', 'long', 'code'], 'd.edu': '4', 'd.income': '70', 'd.risk': '1', 'd.ai': 4 });
  Object.assign(a, { 'l.success': ['difference', 'family'], 'l.causes': ['health', 'edu', 'community'], 'l.meaning': 4, 'l.visible': 2, 'l.ownbiz': 2, 'l.family': 4, 'l.regret': 'help' });
  Object.assign(a, { 'e.on': ['teach', 'comfort', 'research', 'organize'], 'e.off': ['persuade', 'perform', 'fix'] });
  return a;
}
