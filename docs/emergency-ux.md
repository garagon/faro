# Emergency interaction and magnitude colors

## Emergency flows

The home is a compact board ordered by need. First come three actions: call the local emergency number (a telephone link to the country's first official number), tell family you are OK (the status screen) and what to do now (the emergency screen). Then a map beside one row per hazard (on phones the rows come first), and after it "Official now": one line per message, warnings in force from the national weather service first and then civil-protection posts (SINAPROC in Panama), each opening in place with its areas, instructions and link; the flood row opens the matching warning. Then the official response to a specific disaster as one row. A recent NOAA tsunami threat message shows a banner above the actions and on the emergency screen. It leads with the natural-warning step (on the coast after strong or long shaking, go on foot to high ground), names the basin and never says whether it applies to a coast. It survives an offline reload, saying since when it has not been updated. Detail lives on its own page, reached from each row: the earthquake list with filters and pages, tsunami bulletins, cyclones, NWS alerts and international alerts, with a link back to the situation. Every block uses the same card, heading and row style.

Setup never blocks the app. On a first visit the home shows a card asking only for nationality, which Faro needs to show the person's embassy; "Not now" hides it in this browser. The profile never opens a popup: the profile button and "Add name and contact" go to My trip, a form in five optional sections (about you, emergency contact, health, travel insurance, accommodation and dates). Sections collapse to one line that shows what is filled in. Beside the form, the card it produces is shown as it will be sent, with buttons for WhatsApp, Telegram, SMS, email, the system share sheet and copy. The status message in My status uses the same buttons, still only for a newly prepared, unchanged, recent message.

The go bag is its own section in the menu (Situation, Local help, My status, Go bag, My trip, Guide). The guide links to it.

The emergency button stays in the fixed desktop sidebar and mobile header, in the one red used for calling, and opens the emergency screen. It is a screen, not a popup: it scrolls with the page, stays open while the person calls and is marked as the current page. Keyboard focus starts on the call button. Without a country it starts on the question "Which country are you in?" and the country search does not open by itself. No call is placed by Faro. In order it shows:

1. The selected country's official emergency numbers.
2. "First minutes": the person chooses what is happening (earthquake, hurricane or storm, flood; earthquake is preselected; one tab stop, arrow keys move between options), then sees five or six actions for it and three for any emergency (call the local number, follow local officials, prefer text messages). Each step restates cited guidance in `src/data/firstMinutes.ts` and some offer shortcuts to the numbers, tsunami information or a status update. Faro never selects the hazard from a feed.
3. Consular phones for the saved nationality when a current, verified listing has one (never historical references), and nationality packs such as the U.S. State Department lines. Consular contacts are presented after local emergency numbers for immediate danger.
4. The saved meeting point when the plan belongs to the selected country, labelled as a personal, unverified note.
5. The latest published earthquake for that country, with its source and age.

On wide screens the first steps sit beside the numbers, so both are visible without scrolling; on phones everything stacks in the order above. Four shortcuts close the screen: status update, hospitals and embassies, tsunami bulletins and the full guide. The screen opens offline after a first visit.

Status messages follow established wording for disasters: the American Red Cross "Safe and Well" statements (I'm safe, where I am, I'll write again when I can) and the FCC/FEMA advice to prefer text messages and keep calls for vital information. The closing asks people to reply by text rather than call; a help request asks for a reply as soon as it is seen. A status update has three steps: select the current state and optional location, review the generated message, then choose a sharing method. Other fields are under an optional disclosure. Help suggestions insert editable text only after selection. Nothing infers the person's status from an earthquake, map position or saved message. Phone/email remain opt-in. Changing the text or output language requires another review; elapsed time still invalidates sharing. Browser persistence can fail without preventing preparation of a message.

Ready messages (for example "I'm OK, poor signal" or "I need medical care") are shortcuts for the first step. Picking one selects its status and fills only what its label states; it never overwrites text the person wrote, and switching to another ready message replaces only the previous ready text. Ready text follows the chosen message language; edited text is kept as written. The person still reviews the full message before sharing, and no ready message speaks for other people.

The messages identify their context, include only selected details and retain the preparation timestamp with its UTC offset. A selected next-contact time is a personal commitment, not a background notification or remote monitoring service. Sharing is initiated by the person in their chosen application; Faro cannot confirm delivery.

Languages: the interface is in Spanish, English and Brazilian Portuguese (ES / EN / PT). Status messages can be written in any of the three, whatever the interface language, so a Brazilian family can receive one in Portuguese. Official texts keep the language the agency published; English and Portuguese readers can translate them on request, always labeled as automatic. Where a guidance graphic exists only in Spanish or English (the ShakeOut "Drop, Cover and Hold On" image), Portuguese readers see the Spanish one, marked as such, with the written steps in Portuguese.

Offline map: Faro's map needs a connection, and Faro never downloads or stores map tiles (provider terms and AGENTS.md). Local help and My trip open the area (the saved stay, or the map's current view, rounded to about 1 km) in Google Maps with the app's own steps to download it for offline use, and its documented limits: no walking, cycling or transit directions offline, expiry without updates, and countries where downloads are unavailable.

## Magnitude palette

Faro's magnitude bands are **a UI convention, not an official risk scale**:

| Displayed magnitude | Color  |
| ------------------- | ------ |
| Below 4.0           | Blue   |
| 4.0–4.9             | Ochre  |
| 5.0–5.9             | Orange |
| 6.0–6.9             | Red    |
| 7.0 and above       | Purple |
| Not reported        | Gray   |

The same helper classifies the one-decimal number in the list, latest event, detail dialog, update history and map. A selected pin retains its magnitude color; its outline distinguishes selection. Cluster circles are neutral and indicate event count, not maximum magnitude. Number labels and an explicit legend supplement color.

[USGS's earthquake map](https://earthquake.usgs.gov/earthquakes/map/?about=true&help=missing) uses marker size for magnitude and color for age. [ShakeMap](https://earthquake.usgs.gov/data/shakemap/) depicts geographically varying shaking intensity. [PAGER](https://earthquake.usgs.gov/data/pager/background.php) estimates population exposure and impact, with separate alert criteria. These are different measurements. Faro does not calculate MMI, PAGER levels, damage, tsunami applicability or personal risk from magnitude. For USGS events, the detail dialog shows the PAGER level, ShakeMap maximum intensity and "Did You Feel It?" counts exactly as USGS publishes them, labelled as regional USGS estimates that do not describe a person's location. The USGS tsunami flag is explained as USGS defines it: a large oceanic event linked to tsunami.gov, not a statement that a tsunami occurred. GDACS colors are a separate humanitarian-impact estimate and can differ from PAGER. See [USGS magnitude versus intensity](https://www.usgs.gov/programs/earthquake-hazards/earthquake-magnitude-energy-release-and-shaking-intensity).

## Validation and remaining limits

Behavior tests cover magnitude boundaries, unknown data, template punctuation, stale-event exclusion, explicit status, expiry, dirty messages and storage failure. Browser review covers mobile/desktop, direct emergency access, country checking, guide access and status preview without sending calls or messages. This is not usability testing with people experiencing an emergency or a claim of full WCAG conformance. Screen-reader testing and cold-start offline support remain separate work.
