# WhatsApp Clone

This is a full-stack WhatsApp clone featuring real-time messaging, user authentication, and a clean interface designed to feel as premium as the original. 

## Project Structure

This repository is split into two main parts:
- **`frontend/`**: A React Native application built using Expo and Expo Router. Handles all user-facing interactions.
- **`backend/`**: A Node.js backend using Express and Firebase to handle user authentication, real-time messaging logistics, and database operations.

## Features

- **User Authentication**: Secure sign-in and registration powered by Firebase Authentication.
- **Real-Time Messaging**: Synchronized instant chat across multiple clients.
- **Premium UI Animations**: Smooth micro-interactions taking advantage of `react-native-reanimated`.
- **Cross-Platform**: Built to work natively on both iOS and Android platforms via Expo.

## Getting Started

### Prerequisites

You will need the following installed:
- [Node.js](https://nodejs.org/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Git](https://git-scm.com/)
- A [Firebase Project](https://firebase.google.com/)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/AmosQuety/WhatsApp-Clone.git
   cd WhatsApp-Clone
   ```

2. **Setup Backend**:
   Navigate into the backend directory and install dependencies:
   ```bash
   cd backend
   npm install
   ```
   *Create a `.env` file by copying the provided `.env.example` and fill in your environment variables.*

3. **Setup Frontend**:
   Navigate into the frontend directory and install dependencies:
   ```bash
   cd ../frontend
   npm install
   ```
   *Ensure you have configured your Firebase settings in `src/config/firebase.ts`.*

### Running the App

To test it locally, you need to spin up both sides:

- **Backend**:
  From the `/backend` directory, start the server:
  ```bash
  npm run dev
  ```

- **Frontend**:
  From the `/frontend` directory, start the Expo app:
  ```bash
  npx expo start
  ```
  *Use the Expo Go app on your physical device, or run it through an iOS Simulator/Android Emulator to test the frontend application.*

## Licensing

MIT License
