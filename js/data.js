/*
 * Study data transcribed from Haridasan et al., CVIR Endovasc 2026;9:121
 * (doi:10.1186/s42155-026-00771-y, CC BY 4.0): Tables 1–3, Figs 1–6 and the Results text.
 */
(function () {
  'use strict';

  // Vancouver style as used by CVIR Endovascular. Slides number these by first citation in the deck,
  // so numbers differ from the paper's own list. PRISMA year and the RoB 2 citation are corrected.
  var REFS = {
    haridasan2026: {
      short: 'Haridasan et al., CVIR Endovasc 2026',
      text: 'Haridasan T, Kena A, Nguyen L, Tan KT. Intra-arterial lidocaine as a pain management strategy for uterine artery embolisation: a systematic review and meta-analysis. CVIR Endovasc. 2026;9:121.',
      doi: '10.1186/s42155-026-00771-y'
    },
    vilos2015: {
      short: 'Vilos et al., J Obstet Gynaecol Can 2015',
      text: 'Vilos GA, Allaire C, Laberge P-Y, Leyland N, Vilos AG, Murji A, et al. The management of uterine leiomyomas. J Obstet Gynaecol Can. 2015;37:157–78.',
      doi: '10.1016/S1701-2163(15)30338-8'
    },
    giuliani2020: {
      short: 'Giuliani et al., Int J Gynaecol Obstet 2020',
      text: 'Giuliani E, As-Sanie S, Marsh EE. Epidemiology and management of uterine fibroids. Int J Gynaecol Obstet. 2020;149:3–9.',
      doi: '10.1002/ijgo.13102'
    },
    baird2003: {
      short: 'Baird et al., Am J Obstet Gynecol 2003',
      text: 'Baird DD, Dunson DB, Hill MC, Cousins D, Schectman JM. High cumulative incidence of uterine leiomyoma in black and white women: ultrasound evidence. Am J Obstet Gynecol. 2003;188:100–7.',
      doi: '10.1067/mob.2003.99'
    },
    balamurugan2025: {
      short: 'Balamurugan et al., J Radiol Clin Imaging 2025',
      text: 'Balamurugan S, Shah R, Panganiban K, Lehrack M, Agrawal DK. Uterine artery embolization: a growing pillar of gynecological intervention. J Radiol Clin Imaging. 2025;8:1–17.',
      doi: '10.26502/jrci.2809105'
    },
    hotan2025: {
      short: 'Ho & Tan, CVIR Endovasc 2025',
      text: 'Ho E, Tan KT. Novel pain management strategy for uterine fibroid embolization. CVIR Endovasc. 2025;8:8.',
      doi: '10.1186/s42155-025-00516-3'
    },
    chan2021: {
      short: 'Chan et al., Semin Intervent Radiol 2021',
      text: 'Chan P, Garcia-Reyes K, Cronan J, Newsome J, Bercu Z, Majdalany BS, et al. Managing postembolization syndrome–related pain after uterine fibroid embolization. Semin Intervent Radiol. 2021;38:382–7.',
      doi: '10.1055/s-0041-1731406'
    },
    spencer2013: {
      short: 'Spencer et al., Semin Intervent Radiol 2013',
      text: 'Spencer EB, Stratil P, Mizones H. Clinical and periprocedural pain management for uterine artery embolization. Semin Intervent Radiol. 2013;30:354–63.',
      doi: '10.1055/s-0033-1359729'
    },
    keyoung2001: {
      short: 'Keyoung et al., J Vasc Interv Radiol 2001',
      text: 'Keyoung JA, Levy EB, Roth AR, Gomez-Jorge J, Chang TC, Spies JB. Intraarterial lidocaine for pain control after uterine artery embolization for leiomyomata. J Vasc Interv Radiol. 2001;12:1065–9.',
      doi: '10.1016/s1051-0443(07)61592-9'
    },
    cai2025: {
      short: 'Cai et al., Pain Manag 2025',
      text: 'Cai T, Zhang R, Chen K, Deng T, Zhan T. Safety and efficacy of intra-arterial lidocaine administration for pain control in uterine artery embolization for cesarean scar pregnancy. Pain Manag. 2025;15:325–32.',
      doi: '10.1080/17581869.2025.2511464'
    },
    tang2022: {
      short: 'Tang et al., Front Surg 2022',
      text: 'Tang Y, Lin B, Zhang Y-P, Hu Y-N, Zhang J-H, Wu S-J, et al. Retrospective analysis of the effect of lidocaine combined with methylprednisolone on pain control after uterine artery embolization. Front Surg. 2022;9:875484.',
      doi: '10.3389/fsurg.2022.875484'
    },
    page2021: {
      short: 'Page et al., BMJ 2021 (PRISMA 2020)',
      text: 'Page MJ, McKenzie JE, Bossuyt PM, Boutron I, Hoffmann TC, Mulrow CD, et al. The PRISMA 2020 statement: an updated guideline for reporting systematic reviews. BMJ. 2021;372:n71.',
      doi: '10.1136/bmj.n71'
    },
    sterne2019: {
      short: 'Sterne et al., BMJ 2019 (RoB 2)',
      text: 'Sterne JAC, Savović J, Page MJ, Elbers RG, Blencowe NS, Boutron I, et al. RoB 2: a revised tool for assessing risk of bias in randomised trials. BMJ. 2019;366:l4898.',
      doi: '10.1136/bmj.l4898'
    },
    sterne2016: {
      short: 'Sterne et al., BMJ 2016 (ROBINS-I)',
      text: 'Sterne JA, Hernán MA, Reeves BC, Savović J, Berkman ND, Viswanathan M, et al. ROBINS-I: a tool for assessing risk of bias in non-randomised studies of interventions. BMJ. 2016;355:i4919.',
      doi: '10.1136/bmj.i4919'
    },
    wan2014: {
      short: 'Wan et al., BMC Med Res Methodol 2014',
      text: 'Wan X, Wang W, Liu J, Tong T. Estimating the sample mean and standard deviation from the sample size, median, range and/or interquartile range. BMC Med Res Methodol. 2014;14:135.',
      doi: '10.1186/1471-2288-14-135'
    },
    noellamy2017: {
      short: 'Noel-Lamy et al., J Vasc Interv Radiol 2017',
      text: 'Noel-Lamy M, Tan KT, Simons ME, Sniderman KW, Mironov O, Rajan DK. Intraarterial lidocaine for pain control in uterine artery embolization: a prospective, randomized study. J Vasc Interv Radiol. 2017;28:16–22.',
      doi: '10.1016/j.jvir.2016.10.001'
    },
    alqahtani2024: {
      short: 'Alqahtani et al., Acta Radiol 2024',
      text: 'Alqahtani A, Han K, Kim SY, Kim M-D, Kwon JH, Kim GM, et al. Efficacy of intra-arterial lidocaine administration on pain and inflammatory response after uterine artery embolization for symptomatic fibroids. Acta Radiol. 2024;65:302–6.',
      doi: '10.1177/02841851221146517'
    },
    duvnjak2020: {
      short: 'Duvnjak & Andersen, CVIR Endovasc 2020',
      text: 'Duvnjak S, Andersen PE. Intra-arterial lidocaine administration during uterine fibroid embolization to reduce the immediate postoperative pain: a prospective randomized study. CVIR Endovasc. 2020;3:10.',
      doi: '10.1186/s42155-020-0099-4'
    },
    katsumori2020: {
      short: 'Katsumori et al., J Vasc Interv Radiol 2020',
      text: 'Katsumori T, Miura H, Yoshikawa T, Seri S, Kotera Y, Asato A. Intra-arterial lidocaine administration for anesthesia after uterine artery embolization with trisacryl gelatin microspheres for leiomyoma. J Vasc Interv Radiol. 2020;31:114–20.',
      doi: '10.1016/j.jvir.2019.09.007'
    },
    zhan2005: {
      short: 'Zhan et al., Eur Radiol 2005',
      text: 'Zhan S, Li Y, Wang G, Han H, Yang Z. Effectiveness of intra-arterial anesthesia for uterine fibroid embolization using dilute lidocaine. Eur Radiol. 2005;15:1752–6.',
      doi: '10.1007/s00330-005-2686-0'
    },
    beecham2026: {
      short: 'Beecham et al., StatPearls 2026',
      text: 'Beecham GB, Nessel TA, Goyal A. Lidocaine. In: StatPearls [Internet]. Treasure Island (FL): StatPearls Publishing; 2026 [cited 2026 Jul 5].',
      url: 'https://www.ncbi.nlm.nih.gov/books/NBK539881/'
    },
    steinman2025: {
      short: 'Steinman & Tan, Clin Radiol 2025',
      text: 'Steinman J, Tan KT. Local anaesthetics in interventional radiology: a primer for radiologists on applications and management of complications. Clin Radiol. 2025;85:106917.',
      doi: '10.1016/j.crad.2025.106917'
    },
    liu2022: {
      short: 'Liu & Li, J Matern Fetal Neonatal Med 2022',
      text: 'Liu S, Li W. Intra-arterial lidocaine for pain control after uterine artery embolization: a meta-analysis of randomized controlled trials. J Matern Fetal Neonatal Med. 2022;35:4162–7.',
      doi: '10.1080/14767058.2020.1847079'
    }
  };

  var STUDIES = [
    { id: 'keyoung', label: 'Keyoung 2001', ref: 'keyoung2001', year: 2001, country: 'United States', iso: 'USA', design: 'RCT', indication: 'Uterine fibroids', scale: 'NRS', n: 18,
      conc: 1.0, dose: 200, vol: 20, timing: ['before'], timingText: 'Immediately before embolisation', agent: 'Polyvinyl alcohol; 500–710 µm' },
    { id: 'zhan', label: 'Zhan 2005', ref: 'zhan2005', year: 2005, country: 'China', iso: 'CHN', design: 'RCT', indication: 'Uterine fibroids', scale: '6-level ordinal', n: 46,
      conc: 0.67, dose: 40, vol: 6, timing: ['after'], timingText: 'Immediately after embolisation was complete', agent: 'Polyvinyl alcohol; 500–710 µm, then 1–3 gelfoam pledgets' },
    { id: 'noellamy', label: 'Noel-Lamy 2017', ref: 'noellamy2017', year: 2017, country: 'Canada', iso: 'CAN', design: 'RCT', indication: 'Uterine fibroids', scale: 'VAS (100-pt)', n: 60,
      conc: 1.0, dose: 100, vol: 20, timing: ['during', 'after'], timingText: 'During UAE mixed with microspheres, or immediately after', agent: 'Nonspherical polyvinyl alcohol; 300–700 µm' },
    { id: 'duvnjak', label: 'Duvnjak 2020', ref: 'duvnjak2020', year: 2020, country: 'United States', iso: 'USA', design: 'RCT', indication: 'Uterine fibroids', scale: 'VAS', n: 36,
      conc: 1.0, dose: 200, vol: 20, timing: ['after'], timingText: 'Immediately after embolisation', agent: 'Tris-acryl gelatin; 500–900 µm' },
    { id: 'katsumori', label: 'Katsumori 2020', ref: 'katsumori2020', year: 2020, country: 'Japan', iso: 'JPN', design: 'Retrospective', indication: 'Uterine fibroids', scale: 'VAS', n: 100,
      conc: 1.0, dose: 80, vol: 8, timing: ['after'], timingText: 'Immediately after embolisation', agent: 'Tris-acryl gelatin; 500–900 µm' },
    { id: 'tang', label: 'Tang 2022', ref: 'tang2022', year: 2022, country: 'China', iso: 'CHN', design: 'Retrospective', indication: 'Uterine fibroids', scale: 'VAS', n: 131,
      conc: 0.5, dose: 100, vol: 20, timing: ['during'], timingText: 'During UAE mixed with microspheres', agent: 'Polyvinyl alcohol; 355–500 µm' },
    { id: 'alqahtani', label: 'Alqahtani 2024', ref: 'alqahtani2024', year: 2024, country: 'Republic of Korea', iso: 'KOR', design: 'Retrospective', indication: 'Uterine fibroids', scale: 'VAS', n: 46,
      conc: 1.0, dose: 100, vol: 10, timing: ['after'], timingText: 'Immediately after embolisation', agent: 'Polyvinyl alcohol particles; 355–700 µm' },
    { id: 'cai', label: 'Cai 2025', ref: 'cai2025', year: 2025, country: 'China', iso: 'CHN', design: 'Retrospective', indication: 'Caesarean scar pregnancy', scale: 'VAS', n: 255,
      conc: 2.0, dose: 80, vol: 4, timing: ['before'], timingText: 'Before embolisation', agent: 'Gelatin sponge; 560–710 µm' }
  ];

  var FOREST = {
    pain4h: {
      title: '4-h post-procedure pain score',
      unit: 'points',
      axis: [-10, 10], ticks: [-10, -5, 0, 5, 10],
      rows: [
        { study: 'Cai 2025', ref: 'cai2025', e: [5.1, 1, 32], c: [5.1, 1.1, 184], w: 31.6, md: 0.00, lo: -0.38, hi: 0.38 },
        { study: 'Duvnjak 2020', ref: 'duvnjak2020', e: [3.97, 2.31, 20], c: [5.37, 2.1, 20], w: 21.3, md: -1.40, lo: -2.77, hi: -0.03 },
        { study: 'Noel-Lamy 2017', ref: 'noellamy2017', e: [3.2, 2.35, 40], c: [5.94, 3.03, 20], w: 19.7, md: -2.74, lo: -4.25, hi: -1.23 },
        { study: 'Tang 2022', ref: 'tang2022', e: [3.3, 1.88, 36], c: [4.16, 1.87, 45], w: 27.5, md: -0.86, lo: -1.68, hi: -0.04 }
      ],
      total: { e: 128, c: 269, md: -1.07, lo: -2.13, hi: -0.01 },
      het: 'Tau² = 0.89; Chi² = 16.54, df = 3 (P = 0.0009); I² = 82%',
      overall: 'Z = 1.99 (P = 0.05)',
      figure: 'assets/figures/fig2-forest-4h.png', figNo: 2
    },
    painMax: {
      title: 'Maximum pain score within 24 h',
      unit: 'points',
      axis: [-10, 10], ticks: [-10, -5, 0, 5, 10],
      rows: [
        { study: 'Cai 2025', ref: 'cai2025', e: [5.5, 0.9, 32], c: [5.8, 0.9, 184], w: 22.2, md: -0.30, lo: -0.64, hi: 0.04 },
        { study: 'Duvnjak 2020', ref: 'duvnjak2020', e: [4.3, 2.14, 20], c: [6.1, 2.04, 16], w: 15.2, md: -1.80, lo: -3.17, hi: -0.43 },
        { study: 'Katsumori 2020', ref: 'katsumori2020', e: [3.8, 2.5, 50], c: [3.8, 2.4, 50], w: 18.4, md: 0.00, lo: -0.96, hi: 0.96 },
        { study: 'Keyoung 2001', ref: 'keyoung2001', e: [3.5, 1.89, 10], c: [7, 2.03, 8], w: 12.1, md: -3.50, lo: -5.33, hi: -1.67 },
        { study: 'Noel-Lamy 2017', ref: 'noellamy2017', e: [3.3, 2.67, 40], c: [5.94, 3.03, 20], w: 13.8, md: -2.64, lo: -4.20, hi: -1.08 },
        { study: 'Tang 2022', ref: 'tang2022', e: [3.5, 2.1, 36], c: [4.84, 2.36, 45], w: 18.3, md: -1.34, lo: -2.31, hi: -0.37 }
      ],
      total: { e: 188, c: 323, md: -1.37, lo: -2.30, hi: -0.45 },
      het: 'Tau² = 0.97; Chi² = 25.86, df = 5 (P < 0.0001); I² = 81%',
      overall: 'Z = 2.91 (P = 0.004)',
      figure: 'assets/figures/fig3-forest-max24h.png', figNo: 3
    },
    morphine: {
      title: '24-h morphine consumption (mg)',
      unit: 'mg',
      axis: [-20, 20], ticks: [-20, -10, 0, 10, 20],
      rows: [
        { study: 'Cai 2025', ref: 'cai2025', e: [19.7, 4.2, 32], c: [17.9, 5.8, 184], w: 31.4, md: 1.80, lo: 0.12, hi: 3.48 },
        { study: 'Duvnjak 2020', ref: 'duvnjak2020', e: [11.2, 7.3, 20], c: [20.2, 10.8, 16], w: 14.4, md: -9.00, lo: -15.18, hi: -2.82 },
        { study: 'Katsumori 2020', ref: 'katsumori2020', e: [13.9, 3.1, 50], c: [13.4, 3.1, 50], w: 32.8, md: 0.50, lo: -0.72, hi: 1.72 },
        { study: 'Keyoung 2001', ref: 'keyoung2001', e: [17.4, 14.7, 10], c: [22.3, 11.2, 8], w: 5.5, md: -4.90, lo: -16.87, hi: 7.07 },
        { study: 'Noel-Lamy 2017', ref: 'noellamy2017', e: [13.7, 10.78, 40], c: [21, 10.5, 20], w: 15.9, md: -7.30, lo: -12.99, hi: -1.61 }
      ],
      total: { e: 152, c: 278, md: -2.00, lo: -5.08, hi: 1.08 },
      het: 'Tau² = 7.13; Chi² = 19.36, df = 4 (P = 0.0007); I² = 79%',
      overall: 'Z = 1.27 (P = 0.20)',
      figure: 'assets/figures/fig4-forest-morphine.png', figNo: 4
    }
  };

  var TIMEPOINTS = [
    { t: 0, label: '0 h', k: 3, n: null, md: -0.54, lo: -2.03, hi: 0.96, p: '0.48', i2: 96 },
    { t: 4, label: '4 h', k: 4, n: 397, md: -1.07, lo: -2.13, hi: -0.01, p: '0.05', i2: 82, sig: true },
    { t: 7, label: '7 h', k: 3, n: 177, md: -0.36, lo: -0.98, hi: 0.26, p: '0.26', i2: 0 },
    { t: 24, label: '24 h', k: 4, n: 393, md: -0.09, lo: -0.52, hi: 0.34, p: '0.70', i2: 24 }
  ];
  var PEAK = { label: 'Peak, 0–24 h', k: 6, n: 511, md: -1.37, lo: -2.30, hi: -0.45, p: '0.004', i2: 81, sig: true };

  var SENSITIVITY = [
    { outcome: '4-h pain score', k: 4, all: { md: -1.07, lo: -2.13, hi: -0.01, p: '0.05', i2: 82 }, excl: { md: -1.52, lo: -2.58, hi: -0.46, p: '0.005', i2: 56 }, fig: 'Supplementary Fig. S7' },
    { outcome: 'Maximum 24-h pain score', k: 6, all: { md: -1.37, lo: -2.30, hi: -0.45, p: '0.004', i2: 81 }, excl: { md: -1.71, lo: -2.84, hi: -0.57, p: '0.003', i2: 75 }, fig: 'Supplementary Fig. S8' }
  ];

  // Single studies, not pooled. Sufentanil units are as printed in the paper.
  var OTHER_OPIOIDS = [
    { name: 'Fentanyl, 24 h', ref: 'alqahtani2024', who: 'Alqahtani 2024', unit: 'µg', ial: [1037, 573], ctl: [881, 419], axis: [0, 1800], ticks: [0, 600, 1200, 1800], verdict: 'Higher with IAL' },
    { name: 'Sufentanil, 24 h', ref: 'tang2022', who: 'Tang 2022', unit: 'mg', ial: [38.3, 6.25], ctl: [45.7, 6.51], axis: [0, 60], ticks: [0, 20, 40, 60], verdict: 'Lower with IAL' }
  ];

  var MARKERS = [
    { name: 'CRP at 24 h', md: -5.58, lo: -14.79, hi: 3.63, p: '0.23', i2: 89, axis: [-20, 10], ticks: [-20, -10, 0, 10] },
    { name: 'WBC at 24 h', md: -1.14, lo: -2.61, hi: 0.32, p: '0.13', i2: 43, axis: [-4, 2], ticks: [-4, -2, 0, 2] }
  ];

  // Per-domain judgements, one letter per domain: L low, M moderate / some concerns, S serious.
  var ROB = {
    rob2: {
      tool: 'RoB 2', group: 'Randomised trials', domains: [
        'Bias arising from the randomisation process',
        'Bias due to deviations from intended interventions',
        'Bias due to missing outcome data',
        'Bias in measurement of the outcome',
        'Bias in selection of the reported result'
      ],
      rows: [
        { study: 'Duvnjak 2020', ref: 'duvnjak2020', d: 'MLMLM', overall: 'M' },
        { study: 'Noel-Lamy 2017', ref: 'noellamy2017', d: 'LLLLL', overall: 'L' },
        { study: 'Zhan 2005', ref: 'zhan2005', d: 'LLLLM', overall: 'M' },
        { study: 'Keyoung 2001', ref: 'keyoung2001', d: 'LLLLM', overall: 'M' }
      ],
      labels: { L: 'Low', M: 'Some concerns', S: 'High' },
      figure: 'assets/figures/fig6-rob2.png', figNo: 6
    },
    robinsi: {
      tool: 'ROBINS-I', group: 'Non-randomised studies', domains: [
        'Bias due to confounding',
        'Bias in selection of participants',
        'Bias in classification of interventions',
        'Bias due to deviations from intended interventions',
        'Bias due to missing data',
        'Bias in measurement of outcomes',
        'Bias in selection of the reported result'
      ],
      rows: [
        { study: 'Cai 2025', ref: 'cai2025', d: 'SMLLLML', overall: 'S' },
        { study: 'Alqahtani 2024', ref: 'alqahtani2024', d: 'SMLMLMM', overall: 'S' },
        { study: 'Tang 2022', ref: 'tang2022', d: 'MMLMMMM', overall: 'M' },
        { study: 'Katsumori 2020', ref: 'katsumori2020', d: 'MMLLLMM', overall: 'M' }
      ],
      labels: { L: 'Low', M: 'Moderate', S: 'Serious' },
      figure: 'assets/figures/fig5-robins-i.png', figNo: 5
    }
  };

  var PRISMA = {
    sources: [['Embase', 94], ['MEDLINE', 17], ['Cochrane Library', 12]],
    stages: [
      { key: 'identified', label: 'Records identified', n: 123 },
      { key: 'screened', label: 'Title & abstract screened', n: 102 },
      { key: 'fulltext', label: 'Full text assessed', n: 18 },
      { key: 'included', label: 'Studies included', n: 8 }
    ],
    exits: [
      { n: 21, label: 'Duplicates removed', detail: '20 by Covidence · 1 manually' },
      { n: 84, label: 'Excluded at screening', detail: 'Title & abstract' },
      { n: 10, label: 'Excluded at full text', detail: '5 no full text · 4 wrong study type · 1 no outcome of interest' }
    ]
  };

  window.DECK_DATA = {
    REFS: REFS, STUDIES: STUDIES, FOREST: FOREST, TIMEPOINTS: TIMEPOINTS, PEAK: PEAK,
    SENSITIVITY: SENSITIVITY, OTHER_OPIOIDS: OTHER_OPIOIDS, MARKERS: MARKERS, ROB: ROB, PRISMA: PRISMA
  };
})();
