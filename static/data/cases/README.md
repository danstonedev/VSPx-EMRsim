# 📁 Case Management System

[![Case Format](https://img.shields.io/badge/Format-JSON-blue?style=flat-square)](manifest.json)
[![Regions](https://img.shields.io/badge/Regions-Cervical_•_Shoulder-green?style=flat-square)](#available-cases)
[![Documentation](https://img.shields.io/badge/System-SOAP_Notes-orange?style=flat-square)](#case-structure)

> **Professional Physical Therapy Case Library** - Comprehensive SOAP documentation examples for educational simulation

## 🎯 Overview

This directory contains the **case data system** for the PT EMR Simulator, featuring professionally crafted clinical scenarios designed for PT education. Each case provides complete SOAP documentation with realistic patient presentations, assessment findings, and treatment plans.

## � Case Loading System

The application uses a **manifest-based architecture** for optimal performance and maintainability:

```text
app/data/cases/
├── manifest.json          # Master case registry
├── cervical/
│   └── radiculopathy_001.json
└── shoulder/
    └── impingement_001.json
```

### 🔄 **Dynamic Loading Process**

1. **Manifest First**: Application loads `manifest.json` to discover available cases
2. **On-Demand Fetch**: Individual case files loaded when accessed
3. **Browser Storage Cache (via storage adapter)**: Cases cached for performance, with force-reload capability
4. **Faculty/Student Separation**: Answer keys isolated from student drafts

## 📚 Available Cases

### 🎾 **Shoulder Impingement Syndrome**

- **File**: `shoulder/impingement_001.json`
- **Patient**: 28-year-old recreational tennis player
- **Presentation**: Shoulder pain during overhead activities
- **Key Features**:
  - Comprehensive ROM/MMT assessment
  - Special tests (Hawkins-Kennedy, Neer, Empty Can)
  - Evidence-based treatment progression
  - Return-to-sport planning

### 💻 **Cervical Radiculopathy (C6)**

- **File**: `cervical/radiculopathy_001.json`
- **Patient**: 45-year-old office worker
- **Presentation**: Neck pain with arm radiation
- **Key Features**:
  - Neurological examination findings
  - Provocative testing (Spurling's, ULNT)
  - Activity modification strategies
  - Ergonomic education components

## 🏗️ Case Structure

Each case file contains a complete wrapper with:

```json
{
  "id": "case_shoulder_impingement_001",
  "title": "Tennis Player - Shoulder Pain",
  "latestVersion": 0,
  "caseObj": {
    "meta": {
      "title": "...",
      "setting": "...",
      "regions": [...],
      "acuity": "...",
      "diagnosis": "..."
    },
    "snapshot": {
      "name": "...",
      "age": "...",
      "sex": "...",
      "dob": "...",
      "teaser": "..."
    },
    "history": {
      "chief_complaint": "...",
      "hpi": "...",
      "pain": {...},
      "pmh": [...],
      "meds": [...]
    },
    "findings": {
      "vitals": {...},
      "rom": {...},
      "mmt": {...},
      "special_tests": [...]
    },
    "encounters": {
      "eval": {
        "subjective": { "chiefComplaint": "...", "historyOfPresentIllness": "..." },
        "objective": { "inspection": {...}, "regionalAssessments": {...} },
        "assessment": { "primaryImpairments": "...", "bodyFunctions": "...", "ptDiagnosis": "..." },
        "plan": { "frequency": "...", "goalsTable": {...}, "exerciseTable": {...} },
        "billing": { "diagnosisCodes": [...], "billingCodes": [...] }
      }
    }
  }
}
```

## 🔗 Faculty → Student Draft Mapping

When faculty create cases in answer key mode, the complete case data maps to student draft fields through a comprehensive mapping system:

### 📝 **Subjective Section**

- `history.chief_complaint` → `draft.subjective.chiefComplaint`
- `history.hpi` → `draft.subjective.historyOfPresentIllness`
- `history.pain.level` → `draft.subjective.painScale`
- `history.pain.location` → `draft.subjective.painLocation`
- `history.pain.quality` → `draft.subjective.painQuality` (normalized to UI enum)
- `history.pain.aggravating_factors` → `draft.subjective.aggravatingFactors`
- `history.pmh` → `draft.subjective.pastMedicalHistory`
- `history.functional_goals` → `draft.subjective.patientGoals`

### 🔍 **Objective Section**

- `encounters.eval.objective.inspection.visual` → `draft.objective.inspection.visual`
- `encounters.eval.objective.palpation.findings` → `draft.objective.palpation.findings`
- `encounters.eval.objective.regionalAssessments` → `draft.objective.regionalAssessments`
  - **ROM data**: `rom.{index}` → UI table rows with left/right values
  - **MMT data**: `mmt.{index}` → normalized grades (e.g., "4-/5")
  - **PROM data**: `prom.{movement-side}` → table format with notes
  - **Special tests**: `specialTests.{test-index}` → left/right/notes format

### ⚕️ **Assessment Section**

- `encounters.eval.assessment.primaryImpairments` → `draft.assessment.primaryImpairments`
- `encounters.eval.assessment.bodyFunctions` → `draft.assessment.bodyFunctions`
- `encounters.eval.assessment.activityLimitations` → `draft.assessment.activityLimitations`
- `encounters.eval.assessment.participationRestrictions` → `draft.assessment.participationRestrictions`
- `encounters.eval.assessment.ptDiagnosis` → `draft.assessment.ptDiagnosis`
- `encounters.eval.assessment.prognosis` → `draft.assessment.prognosis`

### 📋 **Plan Section**

- `encounters.eval.plan.goalsTable` → `draft.plan.goalsTable`
- `encounters.eval.plan.exerciseTable` → `draft.plan.exerciseTable`
- `encounters.eval.plan.patientEducation` → `draft.plan.patientEducation`
- `encounters.eval.plan.treatmentPlan` → `draft.plan.treatmentPlan`

### 💰 **Billing Section**

- `encounters.eval.billing.diagnosisCodes` → `draft.billing.diagnosisCodes`
- `encounters.eval.billing.billingCodes` → `draft.billing.billingCodes`
- `encounters.eval.billing.ordersReferrals` → `draft.billing.ordersReferrals`

## 🎯 Editor Modes

The case system supports three distinct editor modes:

- **👨‍🎓 Student Mode**: Loads blank draft (respects case-level `editorSettings`)
- **👩‍🏫 Faculty Mode**: Seeds draft from case answer key for editing and refinement
- **🔑 Key Mode**: Read-only view of faculty answer key for reference and validation

## 🔧 Technical Implementation

- **Data Integrity**: All cases validated and migrated via `schema.js`
- **Modern Patterns**: No backward compatibility, clean object-based APIs throughout
- **Performance**: Browser storage caching (via storage adapter) with `forceReloadCases()` utility
- **Maintainability**: Manifest-based organization with individual case files
