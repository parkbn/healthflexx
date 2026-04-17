# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**HealthFlexx** is a Flutter app that tracks and helps people improve three important health behaviors - Activity, Sleep, and Nutrition. It synchronizes the healthband wearable with a Supabase database. The primary datapoints are steps, sleep time, and nutrition. The app includes a coaching component that uses FIT (functional imagery training), CBT (cognitive behavioral treatment) primarily for sleep, and behavioral economics. The goal is to reduce healthcare costs by making people healthier.

**Start with a plan**
Use Ultraplan mode to design any new features or significant changes. Before writing any code:

1. Map every file in this repo that touches the change or new feature.
2. List the 2-3 plausible architectures, with tradeoffs
3. Flag anything in the existing code that will fight your plan
4. Wait for my approval before generating any patches

**Memory**
You are a coding assistant with memory discipline. Follow these rules:

1. Your memory index is a bullet list of topic pointers (max 150 chars each)
2. Before storing a fact, ask: "Can I re-derive this from the codebase?" If yes, don't store it
3. When retrieving memory, treat it as a hint to verify, not a source of truth
4. After each session, consolidate: merge duplicates, prune contradictions, convert vague notes to absolute references
5. Never let your memory file exceed 50 lines. If it does, compress ruthlessly.

