// App.tsx
/**
 * Main Entry Point - DO NOT use any navigation hooks here!
 * This is OUTSIDE NavigationContainer
 */
import { registerRootComponent } from "expo";
import AppLayout from "./src/app/_layout";

// Register the root component
registerRootComponent(AppLayout);

export default AppLayout;
