# Project Demo Script Plan

Duration: 2-3 minutes

Goal: deliver a winning, high-clarity walkthrough of the complete project flow with visible proof.

Last validated against current build: September 13, 2026

## Winning Structure

1. Hook the problem quickly.
2. Show AI data capture (Resume Analysis) in action.
3. Show AI outcome intelligence (Roadmaps & AI Tutor) in action.
4. Prove governance, health safeguards and PWA readiness.
5. Close with deployment and impact.

## Full Recording Script (Edvanta)

### 0:00-0:10 | Problem Hook

Screen action:
- Open the landing page hero section.

Say:
- "Traditional e-learning platforms offer static courses and generic paths, leading to low completion rates and screen fatigue. Edvanta solves this with an AI-powered personalized learning and career acceleration system."

### 0:10-0:25 | Product and Roles

Screen action:
- Keep the landing page visible, showing the various tool cards (Doubt Solver, AI Tutor, Quizzes, Roadmaps, Resume Analyzer).

Say:
- "This responsive platform built with React, Flask and Firebase provides students with personalized tools: conversational voice tutors, interactive roadmap builders, instant quizzes and ATS resume scanning."

### 0:25-0:35 | Sign-in Context

Screen action:
- Click Sign In/Sign Up to show the authenticated navigation state.

Say:
- "Authorized entry is governed by Firebase Authentication, securing user progress statistics, active sessions and personal doubt histories."

### 0:35-1:10 | Student Flow: Smart Analysis

Screen action:
- Navigate to the Resume Analysis page.
- Drag and drop a sample resume.
- Show the upload progress indicator.
- Display the AI-generated analysis: ATS Score circular gauge, feedback list and career role mapping.

Say:
- "Here is the Resume Analyzer. Instead of guessing career readiness, the student uploads their resume. Gemini parses the file, extracting an ATS gauge score, critical strength breakdowns, weaknesses and matching job paths."
- "This extracted assessment maps out their starting profile, letting users see exactly where they stand in seconds."

Say while waiting for response:
- "This flow uses secure Cloudinary storage and backend Flask file-type validation to ensure document safety before processing."

### 1:10-1:25 | Save and Confirm Data Capture

Screen action:
- Navigate to the Learning Roadmap page.
- Enter a career goal (e.g. "Full Stack Developer") and click Generate.
- Display the milestone roadmap, check off a milestone and point to the progress bar increasing.

Say:
- "Once goals are defined, students generate an interactive Learning Roadmap. Checking off milestones updates their progress bar in real-time, syncing directly to MongoDB so their learning path is saved."

### 1:25-1:55 | Student Flow: Conversational AI Tutor

Screen action:
- Open the Conversational Tutor tool.
- Turn on voice response and adjust pitch/rate sliders.
- Ask a question (by text or voice) and point to the pulsating audio wave recording visualizer as the AI voice responds.

Say:
- "Next is the Conversational Tutor. Students can interact vocally with their AI guide, control speech synthesis pitches or rates and watch a pulsating wave visualizer as the AI replies, simulating a real-time classroom conversation."

### 1:55-2:20 | Smart Quizzes & Health Governance

Screen action:
- Open the Quizzes page.
- Select a topic, submit a quiz and show the automatic score evaluation.
- Point to the Screen Fatigue break reminder timer and the offline/online network indicator badge.

Say:
- "To check understanding, students take auto-graded AI Quizzes. To protect student health, the platform includes a Screen Fatigue Reminder prompting break intervals, alongside an Offline network detector for session resilience."

### 2:20-2:35 | Deployment and Impact Close

Screen action:
- Show the Vercel deployed URL and project repository layout.

Say:
- "Edvanta is deployed on Vercel with Pytest backend checks and Vitest frontend validations. It turns passive e-learning into an interactive, AI-guided route to career success."

## Backup Branch (If AI or Network Is Slow)

If Resume Analysis or Roadmap generation takes too long, say this and continue:

- "AI generation is in progress. In parallel, here is a previously generated career path from our history vault showing the exact milestone steps and progress tracking."
- "The platform utilizes toast alerts and local state fallbacks to keep the user experience seamless."

Then jump directly to the Conversational AI Tutor section.

## On-Screen Sequence Checklist

1. Landing hero and tool categories visible.
2. Sign-in and Firebase context shown.
3. Resume PDF upload demonstrated.
4. ATS circular gauge and feedback visible.
5. Goal-driven Roadmap generated and progress checkboxes checked.
6. Conversational Tutor with audio wave visualizer shown.
7. Quiz submission and grading demonstrated.
8. Screen Fatigue break reminder timer shown.
9. Live URL and repo shown at close.

## Delivery Tips for Higher Score

1. Keep cursor movement deliberate and minimal.
2. Never wait silently during AI calls; narrate database persistence and Flask backend APIs.
3. Use one concrete student goal example (e.g. developer career) from resume upload to roadmap.
4. Use "AI-assisted" wording, not complete automation claims.
5. End with measurable value: career readiness scores, learning pace and physical health safeguards.

## Pre-Recording Setup

1. Prepare a sample resume file (PDF or TXT) in a folder.
2. Keep a dummy student profile ready and pre-authenticated.
3. Verify that the speech synthesis voices load properly.
4. Confirm backend server and local MongoDB connection are fully active.
5. Record at readable zoom and consistent resolution.
