import { createTheme, type MantineColorsTuple } from "@mantine/core";

// 沿用 index.html 的 terrarium 深色棕/沙色主題（:root CSS 變數）
const night: MantineColorsTuple = [
  "#f2ebdc",
  "#e8d5a9",
  "#c98b3a",
  "#8f6228",
  "#6b442c",
  "#4a2e1e",
  "#33231a",
  "#2b1e17",
  "#241913",
  "#1c1310",
];

const clay: MantineColorsTuple = [
  "#fbf1e2",
  "#f2ddb8",
  "#e8c98a",
  "#deb55c",
  "#d5a138",
  "#c98b3a",
  "#a86f2c",
  "#8f6228",
  "#6b442c",
  "#4a2e1e",
];

export const theme = createTheme({
  primaryColor: "clay",
  colors: { night, clay },
  fontFamily:
    '"PingFang TC","Noto Sans TC","Microsoft JhengHei","Hiragino Sans",system-ui,sans-serif',
  fontFamilyMonospace:
    'ui-monospace,"SF Mono",Menlo,Consolas,monospace',
  headings: {
    fontFamily:
      '"Noto Serif TC","Songti TC","PMingLiU","Source Han Serif TC",serif',
    fontWeight: "600",
  },
  defaultRadius: "sm",
  other: {
    bone: "#f2ebdc",
    sand: "#e8d5a9",
    mute: "#a89279",
    umber: "#4a2e1e",
    umber2: "#6b442c",
    clayDim: "#8f6228",
    moss: "#8ba05e",
    danger: "#c05a45",
  },
});
