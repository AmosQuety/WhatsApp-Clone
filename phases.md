# Project Phases: Prism Messenger

This document outlines the organized roadmap for building **Prism**, a premium messenger with selective visibility.

## Phase 1: Authentication & Web Foundation (Week 1)
- [x] **AuthHub Setup**: Configure local AuthHub URLs.
- [x] **Backend Middleware**: RS256 JWT verification.
- [x] **Frontend AuthContext**: Web-compatible `SecureStore` fallback.
- [x] **Web Optimization**: Ensure responsive "Prism" UI for browsers.

## Phase 2: Core Messaging & Filtering (Week 2)
- [x] **Firestore Schema**: Define the `messages` collection with the `visibleTo` field.
- [x] **Message Endpoints**: Implement `POST /groups/:groupId/messages` with visibility logic.
- [x] **Security Rules**: Write Firestore security rules to enforce selective visibility.
- [x] **Real-time Subscriptions**: Update frontend to listen for messages with visibility filtering.

## Phase 3: Premium UI (Prism Design) (Week 3)
- [x] **Theme System**: Implement the Glassmorphism design system (UI tokens).
- [x] **Member Picker**: Create a robust recipient picker for Ghost Messaging.
- [x] **Message Bubbles**: Design and build modern, floating message bubbles.
- [x] **Group Management**: Implement sleek group creation and member list views.
- [x] **Responsive UI**: Ensure cross-platform excellence on Web and Mobile.

## Phase 4: Contacts & 1v1 Messaging (Week 4)
- [x] **1v1 Messaging**: Implement direct chat logic between users.
- [x] **Contact Discovery**: Add search-based user discovery.
- [x] **Contacts UI**: Build a dedicated "New Chat" screen with user search.
- [x] **Unification**: Connect the Home screen to the real messaging engine.

## Phase 5: Polish & Optimization (Week 5)
- [x] **Animations**: Added smooth transitions and micro-interactions.
- [x] **Media Support**: Implemented image/file sharing via Firebase Storage.
- [x] **Performance**: Optimized real-time data fetching and state management.
- [x] **Final QA**: Verified end-to-end selective visibility and AuthHub flow.

---
**ALL PHASES COMPLETED!** 🎉
Prism is now a fully functional, premium messenger with selective visibility.
