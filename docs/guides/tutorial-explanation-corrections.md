# October 22 tutorial explanation corrections

This patch corrects three findings from the read-only audit of master
`9495341e2fb6a94262896aec9799817de48cdbca`:

- CPE a663 (The Trip): underpayers reimburse overpayers. Both the explanation
  and animation now distinguish final expense burdens from cash holdings.
  The existing C++ and Python amount-calculation programs are unchanged.
- APCS 2016/03 question 6: use
  `list[current].next = list[list[current].next].next;` to bypass a linked node.
- APCS 2016/03 question 13: `i` is the dividend, `j` the divisor. Save the
  remainder before replacing `(i, j)` with `(j, i % j)`.

## Existing installations

Normal deployment's `prisma migrate deploy` applies the guarded data migration
`20261022000000_correct_tutorial_explanations`. It updates only the two exact
legacy explanations with matching recognition title, original number, statement,
code, options and answer key. It does not depend on production IDs. Edited
questions or administrator-customized explanations are left unchanged; review
those manually if necessary. IDs, answer keys and learner progress are preserved.
Fresh imports use the corrected JSON seed; rerunning the importer alone does
not update pre-existing explanations.

## Verification

`npm run test:tutorial-corrections` tests migration safety against disposable
in-memory SQLite databases and validates animation payment conservation. On
Linux CI it also executes the actual authored C++ snippets and a663's actual
C++/Python programs against independent edge/random oracles. On Windows that
execution test is explicitly skipped: run
`scripts/lib/check-tutorial-explanation-corrections.py` in WSL with JSON stdin
containing the corrected seed's `questions` and `cpeLessons.a663` as `lesson`.
All generated binaries stay in Linux `/tmp`; no Windows executables are created.

No production database is accessed by these tests. Passing these targeted
regressions is not a claim about every tutorial or all hidden judge inputs.
a344's contradictory specification remains quarantined and unchanged.
