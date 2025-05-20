const fs = require("fs");
const path = require("path");

// Get environment variables from Vercel
const firebaseApiKey = process.env.FIREBASE_API_KEY || "";
const firebaseAuthDomain = process.env.FIREBASE_AUTH_DOMAIN || "";
const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || "";
const firebaseStorageBucket = process.env.FIREBASE_STORAGE_BUCKET || "";
const firebaseMessagingSenderId =
  process.env.FIREBASE_MESSAGING_SENDER_ID || "";
const firebaseAppId = process.env.FIREBASE_APP_ID || "";
const firebaseMeasurementId = process.env.FIREBASE_MEASUREMENT_ID || "";
const openaiApiKey = process.env.OPENAI_API_KEY || "";
const openaiModel = process.env.OPENAI_MODEL || "gpt-4o-mini";

// Create environment file content
const envFileContent = `export const environment = {
  production: true,
  firebase: {
    apiKey: '${firebaseApiKey}',
    authDomain: '${firebaseAuthDomain}',
    projectId: '${firebaseProjectId}',
    storageBucket: '${firebaseStorageBucket}',
    messagingSenderId: '${firebaseMessagingSenderId}',
    appId: '${firebaseAppId}',
    measurementId: '${firebaseMeasurementId}',
  },
  openai: {
    apiKey: '${openaiApiKey}',
    model: '${openaiModel}',
  },
};`;

// Ensure directory exists
const dir = path.resolve(__dirname, "src/environments");
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Write file
fs.writeFileSync(path.join(dir, "environment.ts"), envFileContent);

// Run normal build
require("child_process").execSync("ng build", { stdio: "inherit" });
