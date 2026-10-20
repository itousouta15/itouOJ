// Preserve the original public source instead of inventing a judge convention.
export const toiPotentialSourceIssues: Record<
  string,
  {
    title: string;
    message: string;
    input: string;
    publishedOutput: string;
    formulaOutput: string;
  }
> = {
  a344: {
    title: "規格待釐清",
    message:
      "題目明定 F₀=F₁=1、Tₙ=Σᵢ₌₀ⁿ F(Fᵢ)，因此 T₁=2；第一組公開範例卻輸出 1，原題頁亦標記待審。以下只作公式與演算法分析，不是已通過範例的可提交解答。",
    input: "1\n",
    publishedOutput: "1\n",
    formulaOutput: "2\n",
  },
};
