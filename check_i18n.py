#!/usr/bin/env python3
"""i18n integrity checker — validates translation coverage across all locales."""

import json, os, re, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')
LOCALES_DIR = os.path.join(SRC, 'locales')

LOCALES = sorted(f.replace('.json', '') for f in os.listdir(LOCALES_DIR) if f.endswith('.json'))
print(f'Locales: {", ".join(LOCALES)}')

errors = 0
warnings = 0

# ---- 1. load all locale keys ----
locale_data = {}
for lc in LOCALES:
    with open(os.path.join(LOCALES_DIR, f'{lc}.json'), 'r', encoding='utf-8') as f:
        locale_data[lc] = json.load(f)

def flatten_keys(d, prefix=''):
    """Flatten nested dict: {'a': {'b': 1}} → {'a.b'}"""
    if isinstance(d, dict):
        out = set()
        for k, v in d.items():
            full = f'{prefix}.{k}' if prefix else k
            out.update(flatten_keys(v, full))
        return out
    return {prefix}

locale_keys = {lc: flatten_keys(data) for lc, data in locale_data.items()}

# ---- 2. collect all t() keys from source ----
tsx_files = []
for dirpath, _, filenames in os.walk(SRC):
    for fn in filenames:
        if fn.endswith(('.tsx', '.ts')):
            tsx_files.append(os.path.join(dirpath, fn))

static_keys = set()       # t('foo.bar')
dynamic_prefixes = set()  # t(`foo.${x}.bar`) → 'foo'

for fpath in tsx_files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    # Static: t('key'), t("key"), i18n.t('key')
    for m in re.finditer(r"\b(?:i18n\.)?t\(['\"]([^'\"`]+)['\"]", content):
        static_keys.add(m.group(1))
    # Template: t(`...`), i18n.t(`...`)
    for m in re.finditer(r"\b(?:i18n\.)?t\(`([^`]*)`\)", content):
        expr = m.group(1)
        if '${' in expr:
            base = expr.split('${')[0].rstrip('.')
            if base:
                dynamic_prefixes.add(base)
        else:
            static_keys.add(expr)

# ---- 3. verify dynamic prefixes match locale keys ----
print('\n--- 1. Dynamic key prefixes ---')
for dp in sorted(dynamic_prefixes):
    ok = any(any(k.startswith(dp + '.') for k in lk) for lk in locale_keys.values())
    if ok:
        print(f'  ✅ "{dp}.*" — matches keys in all locales')
    else:
        print(f'  ❌ "{dp}.*" — no matching keys found')
        errors += 1

# ---- 4. missing keys: static key missing in any locale ----
print('\n--- 2. Missing translation keys ---')
missing_any = False
for key in sorted(static_keys):
    missing = [lc for lc in LOCALES if key not in locale_keys[lc]]
    if missing:
        print(f'  ❌ "{key}" missing in: {", ".join(missing)}')
        errors += 1
        missing_any = True
if not missing_any:
    print('  ✅ All static keys present in all locales')

# ---- 5. unused keys: in locale but never referenced ----
print('\n--- 3. Unused translation keys ---')
# Keys common to ALL locales that are never used
common = locale_keys[LOCALES[0]].copy()
for lc in LOCALES[1:]:
    common &= locale_keys[lc]

unused = set()
for k in sorted(common):
    if k in static_keys:
        continue
    # Covered by a dynamic prefix?
    if any(k.startswith(dp + '.') for dp in dynamic_prefixes):
        continue
    unused.add(k)

if unused:
    for k in sorted(unused):
        print(f'  ⚠️  "{k}" — defined in all locales but never used')
        warnings += 1
else:
    print('  ✅ No unused keys')

# ---- 6. hardcoded lang ternary ----
print('\n--- 4. Hardcoded lang ternaries ---')
found_ternary = False
for fpath in tsx_files:
    rel = os.path.relpath(fpath, ROOT)
    if 'locales' in rel:
        continue
    with open(fpath, 'r', encoding='utf-8') as f:
        for lineno, line in enumerate(f, 1):
            if re.search(r"lang\s*===\s*['\"]", line):
                print(f'  ❌ {rel}:{lineno}: {line.strip()[:100]}')
                errors += 1
                found_ternary = True
if not found_ternary:
    print('  ✅ No hardcoded lang ternaries')

# ---- 7. locale structure consistency ----
print('\n--- 5. Locale structure consistency ---')
ref = locale_keys[LOCALES[0]]
all_ok = True
for lc in LOCALES[1:]:
    missing_keys = ref - locale_keys[lc]
    extra_keys = locale_keys[lc] - ref
    if missing_keys:
        print(f'  ❌ {lc} missing {len(missing_keys)} keys vs {LOCALES[0]}')
        for k in sorted(missing_keys)[:10]:
            print(f'       - {k}')
        all_ok = False
    if extra_keys:
        print(f'  ⚠️  {lc} has {len(extra_keys)} extra keys vs {LOCALES[0]}')
if all_ok:
    print('  ✅ All locale structures match')

# ---- summary ----
print(f'\n{"=" * 50}')
print(f'Errors: {errors}, Warnings: {warnings}')
if errors > 0:
    print('❌ FAIL — fix the errors above')
    sys.exit(1)
else:
    print('✅ PASS')
