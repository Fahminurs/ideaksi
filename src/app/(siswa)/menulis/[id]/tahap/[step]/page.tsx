import { Suspense } from "react";
import StepView from "./StepView";

// useParams() di StepView butuh <Suspense> pada rute dinamis (Next 16).
export default function StepPage() {
  return (
    <Suspense fallback={null}>
      <StepView />
    </Suspense>
  );
}
