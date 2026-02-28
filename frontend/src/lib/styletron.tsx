"use client";

import { Client, Server } from "styletron-engine-monolithic";
import { Provider as StyletronProvider } from "styletron-react";
import { createDarkTheme, BaseProvider } from "baseui";

const engine =
  typeof window !== "undefined" ? new Client() : new Server();

const landlyTheme = createDarkTheme({
  colors: {
    accent: "#3211d4",
    negative: "#ef4444",
    positive: "#00cc66",
    warning: "#f59e0b",
  },
  typography: {
    DisplayLarge: { fontFamily: "'Space Grotesk', sans-serif" },
    DisplayMedium: { fontFamily: "'Space Grotesk', sans-serif" },
    DisplaySmall: { fontFamily: "'Space Grotesk', sans-serif" },
    DisplayXSmall: { fontFamily: "'Space Grotesk', sans-serif" },
    HeadingXXLarge: { fontFamily: "'Space Grotesk', sans-serif" },
    HeadingXLarge: { fontFamily: "'Space Grotesk', sans-serif" },
    HeadingLarge: { fontFamily: "'Space Grotesk', sans-serif" },
    HeadingMedium: { fontFamily: "'Space Grotesk', sans-serif" },
    HeadingSmall: { fontFamily: "'Space Grotesk', sans-serif" },
    HeadingXSmall: { fontFamily: "'Space Grotesk', sans-serif" },
    LabelLarge: { fontFamily: "'Space Grotesk', sans-serif" },
    LabelMedium: { fontFamily: "'Space Grotesk', sans-serif" },
    LabelSmall: { fontFamily: "'Space Grotesk', sans-serif" },
    LabelXSmall: { fontFamily: "'Space Grotesk', sans-serif" },
    ParagraphLarge: { fontFamily: "'Space Grotesk', sans-serif" },
    ParagraphMedium: { fontFamily: "'Space Grotesk', sans-serif" },
    ParagraphSmall: { fontFamily: "'Space Grotesk', sans-serif" },
    ParagraphXSmall: { fontFamily: "'Space Grotesk', sans-serif" },
    MonoDisplayLarge: { fontFamily: "'Space Grotesk', sans-serif" },
    MonoDisplayMedium: { fontFamily: "'Space Grotesk', sans-serif" },
    MonoDisplaySmall: { fontFamily: "'Space Grotesk', sans-serif" },
    MonoDisplayXSmall: { fontFamily: "'Space Grotesk', sans-serif" },
    MonoHeadingXXLarge: { fontFamily: "'Space Grotesk', sans-serif" },
    MonoHeadingXLarge: { fontFamily: "'Space Grotesk', sans-serif" },
    MonoHeadingLarge: { fontFamily: "'Space Grotesk', sans-serif" },
    MonoHeadingMedium: { fontFamily: "'Space Grotesk', sans-serif" },
    MonoHeadingSmall: { fontFamily: "'Space Grotesk', sans-serif" },
    MonoHeadingXSmall: { fontFamily: "'Space Grotesk', sans-serif" },
    MonoLabelLarge: { fontFamily: "'Space Grotesk', sans-serif" },
    MonoLabelMedium: { fontFamily: "'Space Grotesk', sans-serif" },
    MonoLabelSmall: { fontFamily: "'Space Grotesk', sans-serif" },
    MonoLabelXSmall: { fontFamily: "'Space Grotesk', sans-serif" },
    MonoParagraphLarge: { fontFamily: "'Space Grotesk', sans-serif" },
    MonoParagraphMedium: { fontFamily: "'Space Grotesk', sans-serif" },
    MonoParagraphSmall: { fontFamily: "'Space Grotesk', sans-serif" },
    MonoParagraphXSmall: { fontFamily: "'Space Grotesk', sans-serif" },
  },
});

export function StyletronRegistry({ children }: { children: React.ReactNode }) {
  return (
    <StyletronProvider value={engine}>
      <BaseProvider theme={landlyTheme}>{children}</BaseProvider>
    </StyletronProvider>
  );
}
