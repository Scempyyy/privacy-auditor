# Privacy Scoring Model Specification

> **Version**: 1.0.0-heuristic  
> **Status**: Specification Baseline  
> **Classification**: Deterministic Heuristic  
> 
> *Note: This scoring model is a versioned heuristic designed to highlight privacy-relevant characteristics of an application. It is not an objectively validated or absolute security measurement.*

---

## 1. Scoring Formula Overview

The final privacy score is computed from a baseline score of 100 points, deducting penalties across three independent domains:

$$\text{score} = \text{clamp}(\text{round}(100 - P - T - S), 0, 100)$$

Where:
- **$P$**: Permission Penalty (capped at 60)
- **$T$**: Tracker & Advertising SDK Penalty (capped at 30)
- **$S$**: Security Hygiene Penalty (capped at 15)

The resulting integer score maps directly into four discrete privacy grades:
- **80 – 100**: **Good** (Minimal unnecessary permissions, few or no tracking SDKs, modern security defaults)
- **60 – 79**: **Fair** (Moderate permission requirements or reputable analytics, minor hygiene flags)
- **40 – 59**: **Risky** (Elevated dangerous permissions, advertising/profiling networks detected, outdated SDKs)
- **0 – 39**: **Poor** (Excessive high/critical permissions, intrusive profiling trackers, insecure manifest settings)

---

## 2. Permission Penalty ($P$)

Permissions declared in the application's `AndroidManifest.xml` are evaluated according to their intrinsic risk severity and their contextual alignment with the application's declared category.

### Base Weight by Risk Severity
| Severity Level | Base Penalty Points | Typical Examples |
|---|---|---|
| **Critical** | 10 | `READ_SMS`, `SEND_SMS`, `READ_CALL_LOG`, `PROCESS_OUTGOING_CALLS`, `SYSTEM_ALERT_WINDOW` |
| **High** | 6 | `ACCESS_FINE_LOCATION`, `ACCESS_BACKGROUND_LOCATION`, `CAMERA`, `RECORD_AUDIO`, `READ_CONTACTS` |
| **Moderate** | 3 | `ACCESS_COARSE_LOCATION`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, `BLUETOOTH_CONNECT` |
| **Low / Normal** | 0 | `INTERNET`, `VIBRATE`, `ACCESS_NETWORK_STATE`, `WAKE_LOCK` |

### Contextual Category Multipliers
The base penalty for a permission is adjusted based on the application's functional category (defined in `data/categories.json`):
- **Expected** ($\times 0.25$): Essential or routine for core functionality (e.g. `CAMERA` in a Camera or Video Calling app).
- **Review** ($\times 1.0$): Plausible or optional functionality (e.g. `ACCESS_COARSE_LOCATION` in a Weather app).
- **Unusual** ($\times 1.5$): Unexpected or suspicious for the declared app category (e.g. `READ_CONTACTS` or `READ_SMS` in a Calculator or Flashlight app).

$$\text{Effective Permission Penalty} = \text{Base Weight} \times \text{Category Multiplier}$$

### Permission Group Deduplication
Permissions belonging to the same Android permission group (e.g., `LOCATION`, `STORAGE`, `CONTACTS`, `SMS`) are deduplicated:
- The highest-penalty permission in the group is assessed at **100%** of its effective penalty.
- Each additional permission within the same group contributes **25%** of its calculated effective penalty.

### Domain Cap
$$\mathbf{P = \min(\sum \text{Group Deduplicated Penalties}, 60)}$$

---

## 3. Tracker & Ad SDK Penalty ($T$)

Embedded third-party libraries identified via bytecode class signatures (defined in `data/trackers.json`) are categorized into functional types, each with individual and domain caps:

| Tracker Category | Penalty per Tracker | Maximum Category Cap |
|---|---|---|
| **Advertisement** (ad networks, monetizers) | 4 points each | Maximum 20 points |
| **Profiling / Location / Identification** (fingerprinting, behavioral tracking) | 5 points each | Maximum 15 points |
| **Analytics** (event tracking, metrics) | 2 points each | Maximum 10 points |
| **Crash Reporting** (diagnostics, stability) | 0 points | 0 points (no penalty) |

### Domain Cap
$$\mathbf{T = \min(T_{\text{ad}} + T_{\text{profiling}} + T_{\text{analytics}}, 30)}$$

---

## 4. Security Hygiene Penalty ($S$)

Manifest configurations and compilation targets are evaluated for fundamental security best practices:

| Hygiene Flag | Condition / Detection | Penalty Points |
|---|---|---|
| **Cleartext Traffic Allowed** | `android:usesCleartextTraffic="true"` or permissive Network Security Config | 5 points |
| **Outdated Target SDK (< 23)** | Targets legacy Android versions lacking runtime permissions | 10 points |
| **Intermediate Target SDK (23–29)** | Targets older Android releases without modern scoped storage and privacy controls | 4 points |
| **Debuggable Build** | `android:debuggable="true"` in production release | 8 points |

### Domain Cap
$$\mathbf{S = \min(\sum \text{Hygiene Penalties}, 15)}$$

---

## 5. Worked Example Calculation

Implementation note: fractional totals are rounded to the nearest integer with exact half values rounded upward (`ROUND_HALF_UP`). The domain caps apply to the charged, itemised deductions; reported deduction points therefore sum to the score penalty.

Consider an e-commerce app with:
- Declared permissions:
  - `ACCESS_FINE_LOCATION` (High: 6, Review: $\times 1.0$) = 6.0
  - `ACCESS_COARSE_LOCATION` (Same group `LOCATION`, Moderate: 3, Review: $\times 1.0 \times 25\%$) = 0.75
  - `CAMERA` (High: 6, Expected: $\times 0.25$) = 1.5
  - `READ_CONTACTS` (High: 6, Unusual: $\times 1.5$) = 9.0
  - Total $P = 6.0 + 0.75 + 1.5 + 9.0 = 17.25$
- Detected Trackers:
  - 2 Ad networks ($2 \times 4 = 8 \le 20$) = 8
  - 1 Analytics library ($1 \times 2 = 2 \le 10$) = 2
  - 1 Crash reporter = 0
  - Total $T = 8 + 2 = 10 \le 30$
- Security Hygiene:
  - Target SDK: 33 (Penalty: 0)
  - Cleartext traffic allowed: True (Penalty: 5)
  - Total $S = 5 \le 15$
- Final Score:
  $$\text{score} = \text{clamp}(\text{round}(100 - 17.25 - 10 - 5), 0, 100) = \text{round}(67.75) = 68 \quad (\mathbf{Fair})$$
