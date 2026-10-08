import CtfBoardPage from "./page";

export default function CtfBoardFallback() {
  return <CtfBoardPage searchParams={Promise.resolve({})} />;
}
