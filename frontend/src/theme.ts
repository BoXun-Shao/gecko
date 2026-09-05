import { createTheme, type MantineColorsTuple } from "@mantine/core";

// 沿用 index.html 的 terrarium 深色棕/沙色主題。
// 同時註冊為 `colors.dark`，讓 Mantine 內建深色模式元件（Paper/Table/Modal/body 等）
// 直接吃到這個暖色階，而不是 Mantine 預設的中性灰階（過去只註冊成 "night" 具名色，
// 從未真正覆蓋 dark 階，導致卡片實際渲染成灰色，與頁面底色的暖棕不一致、對比也偏低）。
const night: MantineColorsTuple = [
  "#f2ebdc",
  "#e8d5a9",
  "#d9c3a3",
  "#c7b092",
  "#a8886a", // Paper/Card border (Mantine's default-border resolves to dark.4)
  "#7c5033",
  "#5a3826",
  "#35251a", // Paper/Card/Modal background (Mantine resolves this to dark.7, matching body's default role)
  "#140d0a", // page background (also set directly in index.css since body's CSS wins over the variable)
  "#0a0605",
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
  colors: { night, clay, dark: night },
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
    mute: "#c7b092",
    muteIcon: "#a8886a",
    umber: "#5a3826",
    umber2: "#7c5033",
    clayDim: "#8f6228",
    moss: "#8ba05e",
    danger: "#c05a45",
  },
});
