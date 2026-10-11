// Shared by the submission editor, playground and runtime integration tests.
export const ITOULANG_SUBMISSION_TEMPLATE = `// 讀入一行測資，再輸出答案。
整數 主程式() {
  字串 文字;
  喵getline(喵in, 文字);
  喵out << 文字 << 喵endl;
  回傳 0;
}
`;

export const ITOULANG_PREVIOUS_PLAYGROUND_TEMPLATE = `整數 主程式() {
  喵out << "你好，itouLang！" << 喵endl;
  // 讀取測資：整數 數值; 喵in >> 數值;
  回傳 0;
}
`;

export const ITOULANG_PLAYGROUND_TEMPLATE = `整數 主程式() {
  喵out << "你好，喵++！" << 喵endl;
  // 讀取測資：整數 數值; 喵in >> 數值;
  回傳 0;
}
`;
