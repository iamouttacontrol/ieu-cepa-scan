import { Alert, AlertButton, Platform } from "react-native";

// On web, `globalThis` is the browser `window`. This project's tsconfig does
// not include the DOM lib, so reach the dialog helpers through a typed view of
// globalThis instead of referencing `window` directly.
const webGlobal = globalThis as unknown as {
  alert?: (message: string) => void;
  confirm?: (message: string) => boolean;
};

/**
 * Cross-platform alert.
 *
 * React Native's `Alert.alert` is a no-op on react-native-web, which silently
 * swallows validation messages and errors when the app runs in the browser.
 * On web we fall back to the native `alert` / `confirm` dialogs so the user
 * always gets feedback.
 */
export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[]
): void {
  if (Platform.OS !== "web") {
    Alert.alert(title, message, buttons);
    return;
  }

  const text = message ? `${title}\n\n${message}` : title;

  // No buttons or a single button → simple notification.
  if (!buttons || buttons.length <= 1) {
    webGlobal.alert?.(text);
    buttons?.[0]?.onPress?.();
    return;
  }

  // Two or more buttons → confirm dialog.
  // OK runs the first non-cancel action; Cancel runs the cancel action.
  const cancelBtn = buttons.find((b) => b.style === "cancel");
  const confirmBtn =
    buttons.find((b) => b.style !== "cancel") ?? buttons[buttons.length - 1];

  if (webGlobal.confirm?.(text)) {
    confirmBtn?.onPress?.();
  } else {
    cancelBtn?.onPress?.();
  }
}
