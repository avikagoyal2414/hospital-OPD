
export default function StepThreeReview({
  patient,
  department,
  hospital,
  date,
  timeSlot,
  onBack,
  onReset
}) {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">
        Check Your Appointment Details
      </h1>

      <p>
        {patient.name} • {department?.title} • {hospital.name}
      </p>

      <p>
        {date?.label} • {timeSlot?.label}
      </p>

      <button
        onClick={onBack}
        className="min-h-[56px] w-full border-2 rounded-xl font-bold"
      >
        Back
      </button>

      <button
        onClick={onReset}
        className="min-h-[56px] w-full border-2 rounded-xl font-bold"
      >
        Start Over
      </button>
    </div>
  );
}
