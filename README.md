# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Third-Party Services Used

This application integrates with several third-party services to provide its functionality:

- **Firebase**: Used for backend services, including:
  - **Firebase Authentication**: For user sign-up, login, and session management.
  - **Firestore**: As the primary NoSQL database for storing all application data (users, companies, projects, etc.).
  - **Firebase Storage**: For storing user-uploaded files like expense receipts.

- **Google AI (via Genkit)**: Powers the application's AI features, such as the automatic categorization of expenses from receipt images.

- **Google Fonts**: Provides the custom fonts (`Inter`, `Source Code Pro`, `Space Grotesk`) used to create the application's retro theme.

- **Pravatar**: Used for generating placeholder user avatars based on user IDs.
