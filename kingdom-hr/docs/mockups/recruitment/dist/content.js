/* Authored prototype content. Attribute order: STR, DEX, CON, INT, WIS, CHA. */
const ATTRIBUTES = ['Strength','Dexterity','Constitution','Intelligence','Wisdom','Charisma'];
// Authored starting conditions; these reports do not simulate changes over time.
const ROLES = [
  {
    "name": "Quartermaster",
    "area": "Army supplies",
    "context": "Fortress reserves are full, but deliveries to border posts are irregular.",
    "report": [
      {
        "status": "good",
        "label": "Full reserves",
        "description": "Fortress reserves are fully stocked.",
        "effects": [
          "Garrisons can draw on stored provisions during delivery delays."
        ]
      },
      {
        "status": "concern",
        "label": "Irregular supplies",
        "description": "Border posts receive supplies irregularly.",
        "effects": [
          "Frontier units ration food and postpone resupply-dependent patrols."
        ]
      },
      {
        "status": "concern",
        "label": "Conflicting inventories",
        "description": "Warehouse counts disagree with the ledgers.",
        "effects": [
          "Available stock is uncertain.",
          "Dispatches require recounts before supplies can be released."
        ]
      }
    ],
    "defaults": [
      1,
      1,
      1,
      11,
      9,
      1
    ]
  },
  {
    "name": "Border captain",
    "area": "Border security",
    "context": "The main crossings are secure; outlying patrols and relations with villagers remain strained.",
    "report": [
      {
        "status": "good",
        "label": "Secure crossings",
        "description": "The main crossings remain secure.",
        "effects": [
          "Routine traffic passes through guarded checkpoints."
        ]
      },
      {
        "status": "concern",
        "label": "Understaffed patrols",
        "description": "Outlying patrols are frequently short of soldiers.",
        "effects": [
          "Fewer routes can be covered.",
          "Reports from remote settlements arrive less often."
        ]
      },
      {
        "status": "concern",
        "label": "Civilian grievances",
        "description": "Villagers report damage caused by the garrison.",
        "effects": [
          "Local cooperation with soldiers is strained.",
          "Damage claims remain unresolved."
        ]
      }
    ],
    "defaults": [
      10,
      1,
      10,
      1,
      8,
      1
    ]
  },
  {
    "name": "Court physician",
    "area": "Healthcare",
    "context": "Capital infirmaries are functioning well, while provincial clinics are understaffed.",
    "report": [
      {
        "status": "good",
        "label": "Reliable infirmaries",
        "description": "Capital infirmaries are functioning well.",
        "effects": [
          "Routine treatment is available in the capital."
        ]
      },
      {
        "status": "concern",
        "label": "Understaffed clinics",
        "description": "Provincial clinics lack enough trained staff.",
        "effects": [
          "Patients wait longer.",
          "Remote settlements receive fewer clinic visits."
        ]
      },
      {
        "status": "concern",
        "label": "Medicine shortages",
        "description": "Rural medicine deliveries are irregular.",
        "effects": [
          "Some treatments are delayed or interrupted."
        ]
      },
      {
        "status": "concern",
        "label": "Distrust at court",
        "description": "The royal household refuses treatment from its physicians.",
        "effects": [
          "Court patients remain untreated despite available care."
        ]
      }
    ],
    "defaults": [
      1,
      1,
      1,
      11,
      10,
      1
    ]
  },
  {
    "name": "Tax assessor",
    "area": "Revenue",
    "context": "Capital taxes arrive on time; western assessments remain disputed.",
    "report": [
      {
        "status": "good",
        "label": "Timely payments",
        "description": "Capital taxes are paid on schedule.",
        "effects": [
          "The treasury receives predictable payments from the capital."
        ]
      },
      {
        "status": "concern",
        "label": "Disputed assessments",
        "description": "Western districts submit conflicting accounts of the same harvest.",
        "effects": [
          "Expected revenue is uncertain.",
          "Disputed balances remain uncollected."
        ]
      },
      {
        "status": "concern",
        "label": "Appeal backlog",
        "description": "Assessment appeals remain unanswered.",
        "effects": [
          "Disputed cases stay open.",
          "Residents continue waiting for corrected assessments."
        ]
      }
    ],
    "defaults": [
      1,
      1,
      1,
      10,
      1,
      8
    ]
  },
  {
    "name": "Archivist",
    "area": "Public records",
    "context": "Recent decrees are catalogued, but older provincial records are difficult to retrieve.",
    "report": [
      {
        "status": "good",
        "label": "Catalogued decrees",
        "description": "Recent royal decrees are fully catalogued.",
        "effects": [
          "Current orders and amendments can be retrieved reliably."
        ]
      },
      {
        "status": "concern",
        "label": "Unindexed records",
        "description": "Older provincial records are difficult to retrieve.",
        "effects": [
          "Requests involving provincial records take longer."
        ]
      },
      {
        "status": "concern",
        "label": "Damp storage",
        "description": "Damp is damaging the older registers.",
        "effects": [
          "Some entries are becoming illegible.",
          "Affected volumes cannot be consulted while being dried."
        ]
      }
    ],
    "defaults": [
      1,
      1,
      1,
      11,
      8,
      1
    ]
  },
  {
    "name": "Envoy",
    "area": "Foreign relations",
    "context": "The neighbouring court continues routine correspondence.",
    "report": [],
    "defaults": [
      1,
      1,
      1,
      9,
      9,
      11
    ]
  }
];
// name, race, age, home, attributes, summary, employment, disclosed perk
const BIOS = [
 ['Marta Voss','Human',43,'Northwatch',[8,10,12,16,14,9],'I put stores in order and keep them that way. I am seeking a permanent appointment with a warehouse that remains in one place.','Keeper of stores, Northwatch|Completed the final inventory following the fortress’s reassignment to its besiegers.','Meticulous|Checks every discrepancy. Routine work takes longer.'],
 ['Oren Pike','Human',36,'Greyford',[13,12,15,12,12,13],'Twelve winters on supply roads have taught me which figures survive contact with the weather. I prefer practical authority to an impressive title.','Convoy supervisor, Eastern Road|Brought eleven of twelve convoys home. The twelfth is now a village.','Field improviser|Finds practical substitutes; documentation may follow later.'],
 ['Tessa Bell','Human',27,'The capital',[7,13,10,17,11,10],'I have maintained accounts for three departments and would welcome responsibility for an entire establishment. I am comfortable correcting senior colleagues.','Accounts clerk, Office of Grain|Reconciled six years of discrepancies. Departmental farewell was not held.','Exacting|Quick with figures; impatient with repeated mistakes.'],
 ['Bram Copperkettle','Dwarf',91,'Deepwell',[12,9,17,14,15,8],'Stores are promises made tangible. I honour them. I ask only for a dry cellar and written instructions about who may enter it.','Steward, Deepwell Foundry|No recorded shortages. Visitors required an appointment six weeks ahead.','Protective custodian|Reduces losses, but resists lending equipment.'],
 ['Helena Ward','Human',41,'Westmarch',[15,12,15,12,15,13],'I have held the western crossings through three commanders and two revised maps. A quiet border is a useful achievement, even when it earns no medal.','Garrison lieutenant, Westmarch|Negotiated grazing access during the winter blockade.','Measured commander|Prefers preparation and restraint to rapid escalation.'],
 ['Garrick Thorne','Human',34,'Ironhill',[18,14,17,10,8,14],'My record speaks plainly. I restore discipline quickly and expect orders to be obeyed. Available immediately following the merger of my former company.','Captain, Ironhill Free Company|Reduced complaints by requiring them to pass through the captain.','Forceful presence|Commands attention; takes disagreement personally.'],
 ['Nella Reed','Human',30,'Fenbridge',[11,17,12,13,16,11],'I know the river crossings, the people who use them, and which ones are not on the map. I have led patrols, though never a parade.','Patrol leader, Fenbridge Watch|Maintained the southern crossings during two floods.','Local knowledge|Excellent in familiar terrain; little experience with court procedure.'],
 ['Ruk Stonehand','Orc',39,'Northwatch',[17,10,18,11,13,10],'I am seeking a regular commission. My former soldiers can provide references, provided the letter is delivered before the spring planting.','Sergeant, Northern Auxiliaries|Retained every recruit through the winter campaign. Lost the regimental silver.','Patient instructor|Develops inexperienced recruits; drills progress slowly.'],
 ['Edith Vale','Human',52,'The capital',[6,12,10,18,16,12],'I offer twenty-seven years of clinical practice. I will attend the court, but request that my existing patients not be reassigned merely because they lack titles.','Physician, Saint Orra’s Infirmary|Introduced a common treatment register across four wards.','Committed practitioner|Reliable clinical care; unwilling to abandon existing patients.'],
 ['Lucan Ash','Human',29,'White College',[7,14,11,19,11,15],'My research concerns the restoration of failing tissue. I seek access to a wider range of cases and an institution willing to preserve accurate findings.','Research fellow, White College|Published promising preliminary results. Final follow-up remains in progress.','Experimentalist|Pursues new treatments; established routines hold less interest.'],
 ['Sera Morrow','Human',38,'Bracken',[9,15,14,13,17,9],'I have worked where medicine arrives by mule. I can organise a clinic, teach attendants, and distinguish an emergency from a letter bearing a large seal.','District healer, Bracken|Kept three clinics open after the district physician’s retirement.','Resourceful healer|Works with limited supplies; unfamiliar with court etiquette.'],
 ['Ilyra Moss','Elf',147,'Green Hollow',[7,16,12,16,18,11],'I would welcome a placement of sufficient duration to observe outcomes. My last post ended before the third generation of patients could be assessed.','Healer, Green Hollow Hospice|Maintained an uninterrupted case register for eighty years.','Long observation|Notices gradual changes; deliberates over new procedures.'],
 ['Peter Rill','Human',45,'Westmere',[8,11,12,16,13,13],'I believe an assessment should be understandable to the assessed. My books are available for inspection and contain no private notation system.','Assessor, Westmere|Settled outstanding appeals before collecting the disputed balances.','Patient negotiator|Resolves disputes carefully; collection is rarely swift.'],
 ['Alma Flint','Human',32,'The capital',[9,13,11,18,10,12],'I have exceeded every assigned collection target. I am interested in a district whose boundaries have been settled in writing.','Revenue officer, South Ward|Collected arrears from properties previously listed as ornamental ruins.','Persistent collector|Pursues every debt, including those others consider impractical.'],
 ['Jonas Wren','Human',25,'Greyford',[7,14,10,14,15,15],'My training covered both accounts and mediation. I have served as deputy for two years and would now like a desk of my own.','Deputy assessor, Greyford|Maintained records while the assessor attended a prolonged inquiry.','Approachable|People readily discuss problems with him; requests take time.'],
 ['Pella Underbough','Halfling',58,'Millbank',[6,17,12,15,16,14],'Small discrepancies deserve attention. Large ones usually began there. I have no objection to travel if expenses are recorded accurately.','Audit clerk, Millbank|Recovered duplicate payments from six estates and one monastery.','Tenacious auditor|Traces difficult records; dislikes leaving a case unfinished.'],
 ['Agnes Quill','Human',61,'The capital',[5,10,9,17,18,8],'I know what was filed, where it was filed, and which requests to destroy it were unsigned. Seeking continued service after departmental reorganisation.','Senior archivist, Royal Chancery|Kept the succession register through two corrections to the succession.','Institutional memory|Remembers precedent; resists unnecessary changes.'],
 ['Felix Dane','Human',26,'White College',[7,15,11,18,12,12],'I specialise in indexing systems and would like to make public records easier to retrieve. My catalogue can be demonstrated with an ordinary shelf.','Cataloguer, White College|Reduced retrieval times. Older staff continued using the previous system.','Systematic|Builds useful systems; needs others to adopt them.'],
 ['Ruth Sallow','Human',40,'Northwatch',[9,12,13,14,16,10],'I have recovered records from damp, fire, and hurried evacuation. I would prefer my next collection to remain inside a building.','Records officer, Northwatch|Recovered civilian registers during the siege. Military annex was sealed.','Conservator|Protects fragile records; limits casual access.'],
 ['Vekk Inkfinger','Goblin',33,'Old Canal',[7,18,12,16,14,9],'I read six scripts and can work in confined shelving. I am applying for a post with a formal key policy, for everyone’s convenience.','Copyist, Canal Registry|Identified fourteen false deeds. Resigned before the ownership hearing.','Fine copyist|Reads damaged scripts; unusually protective of working notes.'],
 ['Celia Vane','Human',37,'The capital',[8,12,11,15,14,18],'I have accompanied three embassies and know how much can depend on the order in which chairs are placed. I seek authority to speak as well as arrange.','Secretary, Western Embassy|Maintained correspondence during the ambassador’s year of silence.','Protocol expert|Navigates formal courts; informal negotiations are less familiar.'],
 ['Hugh Mercer','Human',48,'Greyford',[11,11,14,13,16,15],'I have negotiated river access and grain contracts without once requiring a change of dynasty. Available after the close of the spring market.','Trade delegate, Greyford|Secured reciprocal toll reductions across four river towns.','Practical diplomat|Finds workable bargains; seldom seeks ceremonial advantage.'],
 ['Darin Holt','Human',31,'Ironhill',[13,14,13,14,11,17],'My service has involved carrying messages through difficult country and delivering them intact. I am ready to remain for the reply.','Courier, Royal Road|Completed forty-two dispatches. Recipient disputes the wording of one.','Composed speaker|Keeps calm under scrutiny; sometimes omits uncomfortable detail.'],
 ['Eryndel Frost','Elf',112,'Winter Court',[8,15,12,17,17,16],'I have represented a small court among larger neighbours for several decades. I can provide an account of each agreement that remains in force.','Attaché, Winter Court|Renewed the same truce seven times under four different titles.','Deliberate negotiator|Remembers obligations; reluctant to conclude hurried agreements.']
];
// Authored sample employment metadata: employer, workplace, start date, end date.
const EXPERIENCE_DETAILS = [
 ['Northwatch Garrison','Northwatch','Mar 720','Nov 727'],
 ['Eastern Road Supply Office','Greyford','Jan 715','Dec 727'],
 ['Office of Grain','The capital','Sep 724','Oct 727'],
 ['Deepwell Foundry','Deepwell','Apr 694','Nov 727'],
 ['Western Garrison','Westmarch','Jun 716','Dec 727'],
 ['Ironhill Free Company','Ironhill','Feb 720','Sep 727'],
 ['Fenbridge Watch','Fenbridge','May 721','Oct 727'],
 ['Northern Auxiliaries','Northwatch','Oct 717','Nov 727'],
 ['Saint Orra’s Infirmary','The capital','Jan 700','Dec 727'],
 ['White College','White College','Sep 723','Jun 727'],
 ['Bracken District Clinics','Bracken','Apr 716','Nov 727'],
 ['Green Hollow Hospice','Green Hollow','Mar 647','Dec 727'],
 ['Westmere Revenue Office','Westmere','Jul 710','Oct 727'],
 ['South Ward Revenue Office','The capital','Jan 720','Nov 727'],
 ['Greyford Revenue Office','Greyford','Jun 725','Dec 727'],
 ['Millbank Audit Office','Millbank','Aug 709','Sep 727'],
 ['Royal Chancery','The capital','Feb 691','Nov 727'],
 ['White College Library','White College','Sep 724','Jun 727'],
 ['Northwatch Records Office','Northwatch','May 716','Dec 727'],
 ['Canal Registry','Old Canal','Oct 721','Oct 727'],
 ['Western Embassy','The capital','Mar 717','Nov 727'],
 ['Greyford Trade Council','Greyford','Apr 707','Dec 727'],
 ['Royal Courier Service','Ironhill','Jun 719','Sep 727'],
 ['Winter Court','Winter Court','Nov 687','Dec 727']
];
// Earlier employment, newest first. Dates remain before each current role.
const EARLIER_EXPERIENCE = [
  [
    [
      "Supply clerk",
      "Western Garrison",
      "Westmarch",
      "May 712",
      "Feb 720",
      "Tracked winter rations and flagged losses that had previously been entered as weather."
    ],
    [
      "Warehouse assistant",
      "Voss & Daughters Merchants",
      "Greyford",
      "Aug 704",
      "Apr 712",
      "Received river cargo and introduced signed receipts, including for members of the family."
    ]
  ],
  [
    [
      "Wagon master",
      "Greyford Carriers Guild",
      "Greyford",
      "Apr 710",
      "Dec 714",
      "Scheduled grain deliveries around flooded roads and the guild’s recurring dispute over bridge fees."
    ],
    [
      "Teamster",
      "Pike Transport",
      "Westmere",
      "Jun 707",
      "Mar 710",
      "Maintained teams and delivered winter stores to settlements absent from the official route book."
    ]
  ],
  [
    [
      "Junior bookkeeper",
      "South Ward Granary",
      "The capital",
      "Jan 722",
      "Aug 724",
      "Matched grain receipts against warehouse counts and escalated unexplained differences."
    ],
    [
      "Accounts apprentice",
      "Bell & Son Factors",
      "The capital",
      "Jul 719",
      "Dec 721",
      "Prepared wage ledgers. Corrected the firm’s name after the son left and the daughter took over."
    ]
  ],
  [
    [
      "Tool keeper",
      "Deepwell Miners Cooperative",
      "Deepwell",
      "Feb 681",
      "Mar 694",
      "Maintained communal equipment and a lending register that outlasted three treasurers."
    ],
    [
      "Stores apprentice",
      "Copperkettle Ironworks",
      "Deepwell",
      "Sep 664",
      "Jan 681",
      "Counted fittings by hand and investigated a recurring shortage of identical hinges."
    ]
  ],
  [
    [
      "Watch sergeant",
      "Westmarch Town Watch",
      "Westmarch",
      "Mar 709",
      "May 716",
      "Organised mixed patrols and settled recurring disputes between sentries and livestock owners."
    ],
    [
      "Border guard",
      "Western Garrison",
      "Westmarch",
      "Jul 704",
      "Feb 709",
      "Served at river checkpoints and learned both versions of the boundary agreement."
    ]
  ],
  [
    [
      "Drill sergeant",
      "Ironhill Free Company",
      "Ironhill",
      "May 716",
      "Jan 720",
      "Standardised weapons drills. Leave requests fell sharply after the new procedure was introduced."
    ],
    [
      "Man-at-arms",
      "House Thorne Retainers",
      "Ironhill",
      "Aug 712",
      "Apr 716",
      "Escorted estate officials and enforced access to disputed woodland. References available from the estate."
    ]
  ],
  [
    [
      "River scout",
      "Fenbridge Ferrymen",
      "Fenbridge",
      "Mar 718",
      "Apr 721",
      "Marked safe crossings and guided relief wagons when the main bridge was closed."
    ],
    [
      "Watch recruit",
      "Fenbridge Watch",
      "Fenbridge",
      "Sep 715",
      "Feb 718",
      "Kept night watch on the lower quay and maintained a separate log of unregistered boats."
    ]
  ],
  [
    [
      "Squad leader",
      "Northern Auxiliaries",
      "Northwatch",
      "Apr 711",
      "Sep 717",
      "Trained recruits from four provinces using demonstrations rather than translated drill books."
    ],
    [
      "Caravan guard",
      "North Road Carriers",
      "Greyford",
      "Jun 705",
      "Mar 711",
      "Protected supply caravans and taught drivers how to form a defensive camp."
    ]
  ],
  [
    [
      "Junior physician",
      "Saint Orra’s Infirmary",
      "The capital",
      "Jul 697",
      "Dec 699",
      "Managed the fever ward under supervision and introduced written handover notes."
    ],
    [
      "Medical apprentice",
      "Vale Parish Surgery",
      "Westmere",
      "Sep 692",
      "Jun 697",
      "Prepared remedies, visited outlying patients, and kept accounts of treatments that failed."
    ]
  ],
  [
    [
      "Demonstrator in anatomy",
      "White College",
      "White College",
      "Sep 720",
      "Aug 723",
      "Taught practical anatomy and revised consent forms after an objection from the faculty."
    ],
    [
      "Laboratory assistant",
      "College Surgical Laboratory",
      "White College",
      "Oct 717",
      "Aug 720",
      "Prepared specimens and recorded results separately from the supervising professor’s conclusions."
    ]
  ],
  [
    [
      "Travelling healer",
      "Bracken Parish Relief",
      "Bracken",
      "May 711",
      "Mar 716",
      "Visited isolated villages and trained local attendants to recognise cases requiring referral."
    ],
    [
      "Infirmary attendant",
      "Millbank Charitable House",
      "Millbank",
      "Aug 707",
      "Apr 711",
      "Dressed wounds, prepared medicines, and kept the night ward supplied during winter shortages."
    ]
  ],
  [
    [
      "Resident healer",
      "Hollow Road Refuge",
      "Green Hollow",
      "Jun 620",
      "Feb 647",
      "Treated travelling families and followed recovery beyond the usual reporting season."
    ],
    [
      "Herbalist’s assistant",
      "Moss Family Dispensary",
      "Green Hollow",
      "Apr 605",
      "May 620",
      "Catalogued local remedies and recorded which traditions had evidence behind them."
    ]
  ],
  [
    [
      "Deputy assessor",
      "Westmere Revenue Office",
      "Westmere",
      "Feb 705",
      "Jun 710",
      "Reviewed household valuations and reopened appeals left unanswered by his predecessor."
    ],
    [
      "Rate clerk",
      "Westmere Town Council",
      "Westmere",
      "Sep 700",
      "Jan 705",
      "Maintained property rolls and rewrote assessment notices in language residents could understand."
    ]
  ],
  [
    [
      "Arrears clerk",
      "City Revenue Office",
      "The capital",
      "Mar 716",
      "Dec 719",
      "Traced unpaid levies across renamed estates and disputed inheritances."
    ],
    [
      "Ledger assistant",
      "Flint Commercial Agency",
      "Greyford",
      "Jul 713",
      "Feb 716",
      "Balanced merchant accounts and continued sending reminders after clients requested fewer reminders."
    ]
  ],
  [
    [
      "Assessment clerk",
      "Greyford Revenue Office",
      "Greyford",
      "Sep 723",
      "May 725",
      "Prepared appeal files and explained valuation changes at the public counter."
    ],
    [
      "Accounts trainee",
      "Greyford Guild School",
      "Greyford",
      "Aug 721",
      "Aug 723",
      "Combined bookkeeping placements with mediation training; handled the school’s disputed meal charges."
    ]
  ],
  [
    [
      "Estate bookkeeper",
      "Underbough Land Trust",
      "Millbank",
      "Apr 699",
      "Jul 709",
      "Reconciled tenant payments against receipts and identified fees charged twice under different names."
    ],
    [
      "Toll clerk",
      "Millbank Bridge Office",
      "Millbank",
      "Jun 689",
      "Mar 699",
      "Recorded crossings and investigated exemptions claimed by wagons carrying nothing but exemption papers."
    ]
  ],
  [
    [
      "Chancery copyist",
      "Royal Chancery",
      "The capital",
      "Apr 687",
      "Jan 691",
      "Prepared certified copies and retained the original wording when amendments were requested verbally."
    ],
    [
      "Registry apprentice",
      "Capital Civil Registry",
      "The capital",
      "Sep 683",
      "Mar 687",
      "Filed birth and marriage records; established an index for names with several official spellings."
    ]
  ],
  [
    [
      "Library assistant",
      "White College Library",
      "White College",
      "Oct 721",
      "Aug 724",
      "Tested a subject catalogue on the uncatalogued annex, with permission from two of its three custodians."
    ],
    [
      "Bookseller’s assistant",
      "Dane’s Bookshop",
      "Greyford",
      "Jul 718",
      "Sep 721",
      "Managed stock and found requested titles from customers’ accounts of what the cover looked like."
    ]
  ],
  [
    [
      "Parish registrar",
      "Northwatch Parish Office",
      "Northwatch",
      "Jan 710",
      "Apr 716",
      "Copied village records onto durable paper and arranged storage above the recorded flood level."
    ],
    [
      "Bindery assistant",
      "Northwatch Stationers",
      "Northwatch",
      "May 705",
      "Dec 709",
      "Repaired damaged ledgers and documented missing pages before rebinding them."
    ]
  ],
  [
    [
      "Deed transcriber",
      "Old Canal Notaries",
      "Old Canal",
      "Apr 716",
      "Sep 721",
      "Translated property records between three scripts and noted signatures repeated across unrelated deeds."
    ],
    [
      "Scribe’s apprentice",
      "Quayside Letter Office",
      "Old Canal",
      "Jun 711",
      "Mar 716",
      "Wrote petitions and read official replies aloud. Kept copies after several replies went missing."
    ]
  ],
  [
    [
      "Protocol assistant",
      "Office of Foreign Reception",
      "The capital",
      "Jan 712",
      "Feb 717",
      "Arranged audiences and tracked precedence changes following marriages, deaths, and one disputed annulment."
    ],
    [
      "Correspondence clerk",
      "Royal Chancery",
      "The capital",
      "Sep 707",
      "Dec 711",
      "Prepared diplomatic copies and learned which errors required a new letter and which required a new envoy."
    ]
  ],
  [
    [
      "Contracts broker",
      "Greyford Grain Exchange",
      "Greyford",
      "May 701",
      "Mar 707",
      "Negotiated delivery terms between millers and growers through two poor harvests."
    ],
    [
      "Merchant’s clerk",
      "Mercer River Trading",
      "Greyford",
      "Jul 695",
      "Apr 701",
      "Kept cargo accounts and resolved disagreements over whether damp grain counted as additional weight."
    ]
  ],
  [
    [
      "Dispatch rider",
      "Ironhill Garrison",
      "Ironhill",
      "Apr 715",
      "May 719",
      "Carried sealed orders between border posts and returned with written acknowledgements."
    ],
    [
      "Messenger",
      "Ironhill Town Council",
      "Ironhill",
      "Jul 712",
      "Mar 715",
      "Delivered notices and read them aloud when recipients claimed the seal made them illegible."
    ]
  ],
  [
    [
      "Treaty secretary",
      "Winter Court",
      "Winter Court",
      "Feb 669",
      "Oct 687",
      "Maintained parallel treaty texts and tracked obligations surviving a change of ruler."
    ],
    [
      "Junior interpreter",
      "Frost Pass Delegation",
      "Winter Court",
      "Sep 648",
      "Jan 669",
      "Interpreted border talks and compiled a glossary of terms both sides preferred to leave undefined."
    ]
  ]
];
const CANDIDATES = BIOS.map((b,id)=>{
 const [heading,description]=b[6].split('|');
 const [company,location,startDate,endDate]=EXPERIENCE_DETAILS[id];
 return {id,name:b[0],race:b[1],age:b[2],location:b[3],stats:b[4],summary:b[5],
   experience:[
     {jobTitle:heading.split(',')[0],company,location,startDate,endDate,description},
     ...EARLIER_EXPERIENCE[id].map(([jobTitle,company,location,startDate,endDate,description])=>({
       jobTitle,company,location,startDate,endDate,description
     }))
   ],
   perk:b[7].split('|'),role:Math.floor(id/4),patience:3+id%5};
});
