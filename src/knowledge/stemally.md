# StemAlly (StemA11y) — iOS Accessibility App for Blind Students

## What is it?
StemAlly is an iOS accessibility-first education app I'm currently building as a Research Assistant at Northeastern University under Professor Hari Palani, a Spatial Computing expert and CEO of UNAR Labs. The app focuses on STEM education for blind and low-vision students, helping them explore mathematical concepts, geometric shapes, and equations through touch, haptics, and audio.

## Why it exists
Blind students have almost no tools to independently explore STEM diagrams — things like geometric shapes, graphs, and math equations. Most educational apps assume visual interaction. StemAlly changes that by making these concepts accessible through non-visual interaction.

## What I specifically built
- Converted SVG diagram files (provided as JSON endpoints by Prof. Palani's team) into an interactive touch canvas on iPhone where blind users can trace shapes and feel haptic feedback
- When a blind user traces the edge of a shape and reaches a vertex, the device announces the dimensions of that side using VoiceOver
- Plotted data points at the center of each vertex with spatial dimensions so the user gets positional audio feedback as they explore
- Implemented MathCAT and VoiceOver Rotor functions so math equations are read aloud in a structured, accessible format — blind users can hear "x squared plus 2x equals 0" naturally
- Built login pages, dashboard, and onboarding flows following provided Figma designs
- Used Core Data for local caching and MVVM architecture for clean separation of concerns
- Followed all WCAG accessibility guidelines and Apple's accessibility APIs throughout

## The hardest technical challenge
The hardest part wasn't the code — it was thinking entirely from the perspective of a blind user. Every design decision had to be made without assuming any visual context. I had to rethink how a user explores space, understands shape, and processes math without seeing anything. Following WCAG guidelines while building a genuinely usable experience was a constant design challenge.

## Real-world impact
Professor Palani conducted A/B testing of the app at the Carroll Center for the Blind in Boston with actual blind users. Results are pending but real blind students have interacted with the prototype. This is not a side project — it's active accessibility research with a direct impact on blind students' ability to learn STEM independently.

## Tech stack
Swift, SwiftUI, Core Data, MVVM, VoiceOver, MathCAT, Haptic Feedback APIs, WCAG Guidelines, JSON/SVG parsing, iOS Accessibility APIs

## Timeline
October 2025 — Present (part-time Research Assistant role at Northeastern)

## What makes it unique
Most accessibility apps are retrofitted — StemAlly is accessibility-first by design. The haptic canvas system for geometric exploration is novel research. The combination of touch + haptics + spatial audio for STEM content doesn't exist in mainstream education apps.
