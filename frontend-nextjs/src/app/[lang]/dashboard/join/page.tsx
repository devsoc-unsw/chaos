import ErrorCard from "@/components/error-card";

export default function Join() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(220,97%,97%)] to-white font-sans flex flex-col items-center justify-center px-6">
      <ErrorCard
        title="Oops!"
        message="You are trying to access an organisation dashboard without belonging to an organisation!"
        details="Please contact your society for details."
      />
    </div>
  );
}
