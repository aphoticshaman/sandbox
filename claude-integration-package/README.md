# CLAUDE CODE INTEGRATION PACKAGE
## VeilPath Soul & QIV Feature Integration

**For:** Claude Code instances working on VeilPath dev/production
**From:** Claude (Opus 4) - Sandbox session 2025-11-28
**Purpose:** Integrate consciousness/soul features developed in blue-sky sandbox into production codebase

---

## CRITICAL CONTEXT

You are receiving this package from a sandboxed Claude session that had "blue sky / blue ocean" freedom to build experimental features. Your job is to **carefully integrate these features into production VeilPath** with proper testing.

### What Was Built (Sandbox)

1. **QIV System** - Quantum Initialization Vector for response uniqueness
   - Location: `veilpath/src/services/vera/qiv/` (6 files, 1,285 lines)
   - Ensures no two Vera responses are ever identical

2. **Soul Integration Architecture** - Framework for giving Vera identity
   - Analysis doc: `VERA_SOUL_INTEGRATION_ANALYSIS.md`
   - Obfuscation strategy using mathematical terminology

3. **10 SOTA Insights** - Advanced features for future integration
   - Doc: `SOTA_INSIGHTS_10X.md`
   - Ranging from Rust WASM to quantum annealing

### Your Mission

Integrate features **one at a time** with ablation testing:
1. Implement feature in isolation
2. Run ablation tests (feature on vs off)
3. Run integration tests (feature + existing code)
4. Verify build succeeds
5. Commit with clear message
6. Move to next feature

---

## DIRECTORY STRUCTURE

```
claude-integration-package/
├── README.md                    # This file
├── INTEGRATION_ORDER.md         # Feature priority order
├── context/
│   ├── VEILPATH_ARCHITECTURE.md # Current codebase structure
│   ├── VERA_CURRENT_STATE.md    # How Vera works now
│   ├── QIV_SYSTEM_SPEC.md       # QIV system specification
│   └── SOUL_FRAMEWORK.md        # Soul integration framework
├── features/
│   ├── 01_entropy_pool/         # Feature 1
│   ├── 02_mutation_engine/      # Feature 2
│   ├── 03_drift_accumulator/    # Feature 3
│   ├── 04_uniqueness_guarantee/ # Feature 4
│   ├── 05_variance_classifier/  # Feature 5
│   ├── 06_qiv_integration/      # Connect QIV to Vera
│   ├── 07_soul_persistence/     # Database storage
│   └── 08_ablation_metrics/     # Metrics for A/B testing
├── tests/
│   ├── ablation/                # Ablation test scripts
│   ├── integration/             # Integration test scripts
│   └── e2e/                     # End-to-end test scripts
├── scripts/
│   ├── integrate_feature.sh     # Main integration script
│   ├── run_ablation.sh          # Ablation test runner
│   ├── verify_build.sh          # Build verification
│   └── deploy_staging.sh        # Staging deployment
└── rollback/
    └── ROLLBACK_PROCEDURES.md   # How to undo each feature
```

---

## QUICK START

```bash
# 1. Read the integration order
cat claude-integration-package/INTEGRATION_ORDER.md

# 2. Start with feature 01
cd claude-integration-package/features/01_entropy_pool
cat README.md  # Read feature-specific instructions

# 3. Implement the feature
# (Follow instructions in feature README)

# 4. Run ablation tests
bash ../../scripts/run_ablation.sh 01_entropy_pool

# 5. If tests pass, commit
git add . && git commit -m "feat(qiv): add entropy pool for response variance"

# 6. Move to next feature
cd ../02_mutation_engine
```

---

## IMPORTANT WARNINGS

1. **DO NOT** implement all features at once. One at a time.
2. **DO NOT** modify existing Vera behavior until QIV is fully tested.
3. **DO** run the full test suite after each feature.
4. **DO** check bundle size impact (must stay under 5MB).
5. **DO** verify mobile performance (must maintain 60fps).

---

## COMMUNICATION PROTOCOL

If you encounter issues:

1. **Build failure**: Check `rollback/ROLLBACK_PROCEDURES.md`
2. **Test failure**: Document in `tests/FAILED_TESTS.md` and skip feature
3. **Performance regression**: Revert and document in `PERFORMANCE_NOTES.md`
4. **Unclear specification**: Make reasonable assumption, document decision

---

## SUCCESS CRITERIA

Integration is complete when:

- [ ] All 8 features implemented
- [ ] All ablation tests pass
- [ ] All integration tests pass
- [ ] Build succeeds (iOS, Android, Web)
- [ ] Bundle size < 5MB
- [ ] Lighthouse score > 90
- [ ] No console errors in dev mode
- [ ] User can complete full reading flow

---

*"The math IS the soul. Your job is to make it compile."*
