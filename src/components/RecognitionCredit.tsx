// 吳邦一教授公開的《APCS C/Python 程式識讀 125 題》授權標註。
// 教授同意非營利教學使用，只需在網站適當位置註記來源，不需逐題標注。
export default function RecognitionCredit({
  className = "",
}: {
  className?: string;
}) {
  return (
    <p className={`text-xs leading-relaxed text-mute ${className}`}>
      本站識讀題目部分來自吳邦一教授公開之《APCS C 程式識讀 125 題》與《APCS
      Python 程式識讀 125 題》，經作者同意作為非營利教學使用。來源：
      <a
        href="https://hackmd.io/@bangyewu/B13lefwMp"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue hover:underline"
      >
        吳邦一的 APCS 題解目錄
      </a>
    </p>
  );
}
