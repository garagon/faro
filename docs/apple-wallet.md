# Travel cards and Apple Wallet

## Available today

The travel card is generated entirely in the browser as a PNG or a plain-text file. It includes the visible profile, the selected destination's saved hotel plan and contacts, and available official emergency numbers. The complete contents can be reviewed before export. It is an offline snapshot, not current status, an official credential, a shelter certificate or a live alert.

No personal-data endpoint, upload, analytics or remote image renderer is involved. GPS and other destinations' contacts/plans are not exported. Downloaded copies remain outside Faro's storage; deleting a profile in Faro cannot erase those files. On iPhone, open the PNG in Downloads and use Share → Save Image. A PNG is **not** an Apple Wallet pass.

## What is needed for Wallet

Apple Wallet accepts a signed `.pkpass` bundle. An Apple Developer account, a registered Pass Type ID and its signing certificate/private key are required. Faro does not include those credentials or expose an “Add to Apple Wallet” button that cannot work.

A generic pass would show the traveler and destination, with accommodation and selected contacts as secondary/back fields. It must not display a “safe” status, claim official authorization or imply emergency dispatch. Do not embed sensitive data in a scannable barcode by default.

### Privacy-preserving implementation options

1. **Public destination pass:** sign a non-personal, country-specific pass at build time with public emergency contacts and source links. Serve it as `application/vnd.apple.pkpass`. It cannot contain the user's private trip details. Certificates stay in protected signing infrastructure, never the browser or repository.
2. **Personal pass signed on the owner's machine:** build and sign the bundle locally using the developer's certificate, then transfer the signed file to the phone. This requires a trusted local tool; it is not a browser-only consumer flow.
3. **Personal pass signing service:** would require an explicit privacy/product decision. Sending the pass contents to a server changes Faro's current local-only promise. A manifest-hash signing protocol still discloses metadata and needs independent security review; it is not automatically private. Do not implement a general arbitrary-digest signing endpoint.

Before enabling Wallet: provision the certificate, select and document the privacy model, validate the bundle and signature, test adding/removing the pass on a real iPhone, verify field legibility in Spanish/English and accessibility, and define snapshot expiration/update behavior. Automatic updates are a separate service with additional identifiers and retention requirements.

Official references:

- [Apple Wallet — Getting started](https://developer.apple.com/wallet/get-started/)
- [Building a pass](https://developer.apple.com/documentation/walletpasses/building-a-pass)
- [Distributing and updating a pass](https://developer.apple.com/documentation/walletpasses/distributing-and-updating-a-pass)
