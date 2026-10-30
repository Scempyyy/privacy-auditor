# Privacy X-Ray: Permission-to-Bytecode Evidence Analysis

## 1. Overview
Privacy X-Ray is an offline static Dalvik bytecode investigation engine for Android Privacy Auditor.
While manifest inspection reveals what permissions an application requests, Privacy X-Ray inspects Dalvik Executable (DEX) files across multidex archives to detect compiled API callsites and method references associated with those permissions.

## 2. Evidence Architecture
- **Curated Mapping Database**: `data/permission_api_mappings.json` indexes 41 verified permission-to-API relationships across Location, Telephony, Camera, Audio/Microphone, Contacts, SMS, Calendar, Bluetooth, and Advertising Identifiers.
- **Multidex Traversal**: Scans `classes.dex`, `classes2.dex`, and all auxiliary DEX files.
- **Callsite Resolution**: Locates calling classes, methods, descriptors, instruction opcodes, and referenced Android framework classes/methods.

## 3. Evidence Status States
1. `api_reference_found`: A curated permission-related Android API method or class reference was identified in DEX bytecode.
2. `no_reference_observed`: Curated signatures for the declared permission were checked, but no matching method references were observed in inspected DEX files.
3. `not_assessed`: Curated DEX bytecode API mappings are not yet indexed for this permission.

## 4. Technical Disclaimer & Limitations
- Static bytecode references provide compiled evidence, not proof of runtime execution or active data transmission.
- `no_reference_observed` does **not** prove a permission is unused; apps may invoke APIs dynamically via Java reflection, native JNI binaries, unmapped framework helpers, or dynamic code loading.
