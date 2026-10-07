#!/usr/bin/env python3
"""Build flashcards/deck.json from the vocab-*.md and grammar-*.md notes.

Run from the repo root:  python3 flashcards/build_deck.py
"""
import glob, json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def field(text, name):
    """Value of a **...Name...:** line (handles numbered variants like **3. Meaning:**)."""
    m = re.search(r'^\*\*(?:\d+\.\s*)?[^*\n]*?' + name + r'[^*\n]*?:\*\*\s*(.+)$', text, re.M)
    return m.group(1).strip() if m else ''


def first_example(text):
    m = re.search(r'Example sentences[^\n]*\n+\s*1\.\s*(.+)\n(?:\s+\((.+)\))?', text)
    if not m:
        return ''
    ex = m.group(1).strip()
    if m.group(2):
        ex += ' — ' + m.group(2).strip()
    return ex


vocab = []
for path in sorted(glob.glob(os.path.join(ROOT, 'vocab-*.md'))):
    deck = os.path.basename(path)[:-3]
    for block in re.split(r'^## ', open(path, encoding='utf-8').read(), flags=re.M)[1:]:
        head = block.splitlines()[0].strip()
        m = re.match(r'(.+?)\s*[（(]([^)）]+)[)）]\s*$', head)
        word, reading = (m.group(1), m.group(2)) if m else (head, '')
        meaning = field(block, 'Meaning')
        if meaning:
            vocab.append({'word': word, 'reading': reading, 'meaning': meaning,
                          'example': first_example(block), 'deck': deck})

grammar = []
for path in sorted(glob.glob(os.path.join(ROOT, 'grammar-*.md'))):
    text = open(path, encoding='utf-8').read()
    title = re.search(r'^# (.+)$', text, re.M)
    pattern = re.sub(r'\s*\{#.*\}\s*$', '', title.group(1)).strip() if title else os.path.basename(path)[8:-3]
    meaning = field(text, 'Meaning')
    if meaning:
        grammar.append({'pattern': pattern, 'meaning': meaning,
                        'conjugation': field(text, 'Conjugation').lstrip('- '),
                        'example': first_example(text), 'file': os.path.basename(path)})

out = os.path.join(ROOT, 'flashcards', 'deck.json')
with open(out, 'w', encoding='utf-8') as f:
    json.dump({'vocab': vocab, 'grammar': grammar}, f, ensure_ascii=False, indent=1)
print(f'{len(vocab)} vocab, {len(grammar)} grammar -> {out}')
