export const FOODS = ["蟋蟀", "杜比亞蟑螂", "麵包蟲", "大麥蟲", "乳鼠", "其他"];

const SIZES: Record<string, string[]> = {
  蟋蟀: ["針頭", "1–2齡 S", "3–4齡 M", "5齡 L", "成蟲"],
  杜比亞蟑螂: ["S ~1cm", "M ~1.5cm", "L ~2.5cm", "成蟲"],
  麵包蟲: ["S", "M", "L"],
  大麥蟲: ["S", "M", "L"],
  乳鼠: ["粉紅鼠", "初毛鼠", "成鼠"],
};

export function sizesFor(food: string): string[] {
  return SIZES[food.trim()] ?? ["S", "M", "L"];
}

// 沿用 index.html 的 terrarium 配色
export const FOOD_COLORS = ["#e8d5a9", "#c98b3a", "#8ba05e", "#7c5033", "#b5723f", "#9c8064", "#c7b092"];
