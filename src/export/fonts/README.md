# PDF font

`CVDocSans-Regular.ttf` and `CVDocSans-Bold.ttf` are a modified version of
[Carlito](https://github.com/googlefonts/carlito) (SIL Open Font License 1.1,
see `OFL.txt`), the metric clone of Calibri used by the PDF export. Carlito
reserves its name, so the modified files use the family name "CV Doc Sans".

Changes from the original:

- Subset to Latin and Latin Extended (the same ranges as the web fonts).
- Hinting removed.
- Ligatures removed (no GSUB table), so text copied from the PDF, or read by
  an applicant tracking system, keeps every letter ("ti", "fi" stay two letters).

Made with fontTools from the `ofl/carlito` files of the google/fonts repository:

```
pyftsubset Carlito-Regular.ttf --layout-features=kern --drop-tables+=GSUB \
  --no-hinting --desubroutinize --unicodes="U+0000-024F,U+0259,U+02BB-02BC,\
U+02C6,U+02DA,U+02DC,U+1E00-1EFF,U+2000-206F,U+2074,U+20A0-20CF,U+2113,U+2122,\
U+2190-2193,U+2212,U+2215,U+2248,U+2C60-2C7F,U+A720-A7FF,U+FEFF,U+FFFD"
```

followed by renaming name IDs 1, 3, 4, 6, 16 and 21 from "Carlito" to
"CV Doc Sans". The same for `Carlito-Bold.ttf`.
