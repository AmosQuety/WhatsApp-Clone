# WhatsApp Backend Scaffold

This directory contains the backend configuration for the WhatsApp-like React Native MVP.

## Features
- Firestore Security Rules for selective visibility.
- Express.js server with `firebase-admin`.
- Group creation and membership management APIs.
- TypeScript support.

## setup
1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Firebase Service Account**:
    - Go to Firebase Console -> Project Settings -> Service Accounts.
    - Click "Generate new private key".
    - Save the JSON file as `service-account.json` in the `backend` directory.
3.  **Environment Variables**:
    - Copy `.env.example` to `.env`.
    - Update the values with your project credentials.
4.  **Run the server**:
    - Development: `npm run dev`
    - Production: `npm run build && npm start`
5.  **Run tests**:
    - `npm test`

## API Endpoints
- `POST /groups`: Create a new group.
- `POST /groups/:groupId/join`: Join an existing group.

## Selective Visibility Logic
Restricted via Firestore Rules in `firebase.rules`. Messages are filtered based on the `visibleTo` array.
