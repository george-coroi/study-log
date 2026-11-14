# Study Log

A free study tracker for GCSE students. No install, no build step: plain HTML, CSS and JavaScript.

Built with Claude (Anthropic).

- Pomodoro, timer and stopwatch, with a subject and activity for every session
- Daily and weekly totals
- School and personal to-do lists
- OCR Gateway Science A topic tracker (confidence and last revised)
- Grade tracker with a tab for each subject, and target grades
- A pixel-art sidebar: aquarium, bonsai, topic garden, focus sounds and more
- Four colour themes, keyboard shortcuts (press `?`)

## Accounts and privacy

Sign in with Google to keep your log on every device. Without signing in, everything stays in your own browser.

- The app stores one record per person, containing only their study data. It does not read anything else from your Google account.
- Security rules (`firestore.rules`) mean you can only read and write your own record.
- Signing out clears the data from that device (it stays in your account), so shared school computers stay private.
- If you run your own copy and collect people's Google accounts, you are responsible for looking after them. For under-18s in the UK that means UK GDPR and the ICO Children's Code. Add a short privacy notice and a way to delete accounts.

## Run your own copy

1. **Host the files.** Put this folder in a public GitHub repository, then Settings > Pages > Deploy from branch `main`, folder `/ (root)`.
2. **Make a Firebase project** (free Spark plan) at console.firebase.google.com.
   - Build > Authentication > Get started > Sign-in method > turn on **Google**.
   - Authentication > Settings > Authorised domains > add `YOURNAME.github.io`.
   - Build > Firestore Database > Create database (production mode), then Rules > paste in `firestore.rules` > Publish.
   - Project settings > Your apps > Web (`</>`) > copy the config.
3. **Paste the config** into `firebase-config.js` and commit.

The Google button then appears in Settings > Account. Who has signed in is listed under Authentication > Users in the Firebase console.

Accounts do not work when you open `index.html` straight from your computer (Google blocks that). Use the hosted address.

## Files

| File | What it is |
| --- | --- |
| `index.html` | the whole app |
| `styles/` | colours, spacing and layout |
| `sprites.js`, `ascii-animals.html` | the animals |
| `cloud.js` | Google sign-in and saving to your account |
| `firebase-config.js` | your Firebase settings |
| `firestore.rules` | who can read and write what |

## Known limits

- The last change wins if you edit on two devices at once.
- Each person's record is limited to about 900 KB (many thousands of sessions).
- The timer is not synced between devices, only your data.
