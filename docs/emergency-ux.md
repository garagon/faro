# Emergency interaction and magnitude colors

## Emergency flows

The emergency button stays in the fixed desktop sidebar and mobile header. Onboarding is a single step (name, country you are in and nationality, with phone and email optional) and offers emergency numbers first, without saving a profile. The dialog asks the person to check the country before opening a telephone link; no call is placed by Faro. Guidance and personal messages are separate actions available from the dialog.

A status update has three steps: select the current state and optional location, review the generated message, then choose a sharing method. Other fields are under an optional disclosure. Help suggestions insert editable text only after selection. Nothing infers the person's status from an earthquake, map position or saved message. Phone/email remain opt-in. Changing the text or output language requires another review; elapsed time still invalidates sharing. Browser persistence can fail without preventing preparation of a message.

Ready messages (for example "I'm OK, poor signal" or "I need medical care") are shortcuts for the first step. Picking one selects its status and fills only what its label states; it never overwrites text the person wrote, and switching to another ready message replaces only the previous ready text. Ready text follows the chosen message language; edited text is kept as written. The person still reviews the full message before sharing, and no ready message speaks for other people.

The messages identify their context, include only selected details and retain the preparation timestamp with its UTC offset. A selected next-contact time is a personal commitment, not a background notification or remote monitoring service. Sharing is initiated by the person in their chosen application; Faro cannot confirm delivery.

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

[USGS's earthquake map](https://earthquake.usgs.gov/earthquakes/map/?about=true&help=missing) uses marker size for magnitude and color for age. [ShakeMap](https://earthquake.usgs.gov/data/shakemap/) depicts geographically varying shaking intensity. [PAGER](https://earthquake.usgs.gov/data/pager/background.php) estimates population exposure and impact, with separate alert criteria. These are different measurements. Faro does not calculate MMI, PAGER levels, damage, tsunami applicability or personal risk from magnitude. See [USGS magnitude versus intensity](https://www.usgs.gov/programs/earthquake-hazards/earthquake-magnitude-energy-release-and-shaking-intensity).

## Validation and remaining limits

Behavior tests cover magnitude boundaries, unknown data, template punctuation, stale-event exclusion, explicit status, expiry, dirty messages and storage failure. Browser review covers mobile/desktop, direct emergency access, country checking, guide access and status preview without sending calls or messages. This is not usability testing with people experiencing an emergency or a claim of full WCAG conformance. Screen-reader testing and cold-start offline support remain separate work.
