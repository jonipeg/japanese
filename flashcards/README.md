# Daily flashcards

The Nightly Technical Prep page shows 15 vocabulary and 15 grammar flashcards a day, drawn from this repo's notes.

- `build_deck.py` reads every `vocab-*.md` and `grammar-*.md` and writes `deck.json`.
- `flashcards.js` is the page component. It loads the deck (published next to the page as `japanese-deck.json`), shuffles it once with a fixed seed and takes the next 15 of each per day, so no card repeats until the whole deck has been shown. Answers stay hidden until a card is clicked.

After adding notes, run `python3 flashcards/build_deck.py` and republish `deck.json` to the artifact as `japanese-deck.json`.
