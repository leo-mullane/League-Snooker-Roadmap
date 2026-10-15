# UK League Snooker rebuild — requirements

Requirement numbers match the idea numbers in the phase 1 review (internal opportunities page), so R12 is idea 12. Sections in `src/` carry the R-number in an HTML comment where a section exists for it.

## Ideas

| R | Requirement | Shown on |
|---|---|---|
| R01 | One responsive site from 320px; retire the /mobile/ copy | Foundations |
| R02 | Apply the League Snooker design system (phase 3, theme.css only) | Foundations |
| R03 | 17px base type, tabular figures, 48px targets | Foundations, Tables |
| R04 | One H1 per page; titles and descriptions naming page and league | Foundations, all pages |
| R05 | WCAG 2.2 AA; captions, scoped headers, alt text | Foundations, Tables |
| R06 | Readable URLs and 301s from every old .asp address | Foundations |
| R07 | (Removed in V3: a working cookie notice is taken as given on any rebuild) | – |
| R08 | Curated sponsor slot per page; ad-free option | Community home, League overview |
| R09 | Contact form relaying to the secretary; no published personal email | League information |
| R10 | UTF-8 throughout; encoding fixed in migration | Foundations |
| R11 | Search-first homepage across leagues, clubs, teams, players, postcodes | Community home |
| R12 | Postcode and near-me league finder with map | League finder |
| R13 | Directory filters: game, night, format, handicap, veterans, summer | League finder |
| R14 | "This week across the community" figures | Community home |
| R15 | Championship page | Championship |
| R16 | Short attributed testimonials (placeholders) | Community home |
| R17 | Separate routes for players and secretaries | Community home, Run a league |
| R18 | Forum archived read-only; Facebook group promoted | Community |
| R19 | League overview: this week, latest results, table, breaks | League overview |
| R20 | Eight hub tabs replacing 18 links | League hub (all) |
| R21 | Division switcher, remembered | Tables, Fixtures, Rankings |
| R22 | Season archive | Past seasons |
| R23 | Fixtures grouped by week, jump to this week, team filter | Fixtures |
| R24 | Weeks headed with the real match date | Fixtures |
| R25 | Form guide and movement in tables | Tables |
| R26 | Calendar feed per team | Fixtures |
| R27 | Club pages with map, directions, tap-to-call, home teams | Clubs, Club |
| R28 | League logo, header and sponsor within the system | League head |
| R29 | Cup brackets | Cups |
| R30 | Match card with frames, breaks, handicap tags | Match card |
| R31 | Captain result submission with confirmation; each name picked from a dropdown of everyone who has played for the team this season, or added as a new name (which joins the list for next time); a name picked once is removed from the side's other dropdowns; a break box beside each name | Submit a result |
| R32 | Optional live scoring | Live scoring |
| R33 | Personal results and fixture alerts | Alerts and privacy |
| R34 | Player career profile with head to head | Player profile |
| R35 | Handicap stored separately; duplicate players merged | Player profile, Foundations |
| R36 | Dash for no break; qualifying frames for rankings | Rankings |
| R37 | Centuries hall of fame with share cards | Hall of fame |
| R38 | Player name display choice; publication statement | Alerts and privacy, Player profile |
| R39 | Follow teams and players; claim a player record | Alerts and privacy, League hub |
| R40 | Guided league setup replacing 21 emailed questions | Start your league |
| R41 | Pricing calculator | Run a league |
| R42 | Online payment of the season fee | Start your league, Run a league |
| R43 | Keyboard-friendly results grid and approval queue | League admin |
| R44 | Password reset and helper roles | Sign in, League admin |
| R45 | Rewritten Join copy | Run a league |
| R46 | Embeddable widgets | League information |
| R47 | EPSB badge and partnership | League head, Run a league |
| R48 | CSV export | League admin |

## Prototype conventions

| R | Requirement |
|---|---|
| R49 | Prototype navigator and previous/next pager replace the client header and footer; Notes switch off by default, remembered for the session |
| R50 | Real league, team and club names and Cambridge & District Division 1 results for weeks 1–3; all other data is labelled sample data; player names invented |
| R51 | Every page tested at 1440px and 390px with no horizontal overflow and no script errors; main flows exercised end to end |
| R52 | Context carried between pages with ?query parameters, with a sessionStorage fallback |
| R53 | Site header on every site page: logo, main navigation with dropdowns, search, sign in; menu button below 1100px |
| R54 | Section sub-navigation under the header, except on league pages, which keep the league's own tabs |
| R55 | Site footer on every site page: sponsor, four link columns, legal links |
| R56 | No visible scrollbars on navigation strips; they scroll sideways on small screens without one |
| R57 | Nothing shown to the prospect refers to the internal review's "ideas" (checked by validate.js) |

## Open questions for the client

- Advertising: curated sponsors and an ad-free paid option instead of open Google ads? (R08)
- Captain submissions: account sign-in, or a one-time link by text or email? (R31)
- Live scoring beyond finals and the championship? (R32)
- Player name display choice and a statement of what is published? (R38)
- Online payment and an ad-free price? (R42)
- Relationship with the EPSB? (R47)
- Keep the current database and rebuild the front end, or move platform? (Foundations)
- Championship entry rules, deadline, fee and format (R15)
- Infer night, format and flags from league names during migration? (R13)
