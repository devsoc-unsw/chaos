import { useEffect, useState } from "react";

import BookingCalendar from "./booking_calendar.component";
import loginUser from "./login_user.json";

import type React from "react";


/**
 * InterviewBooking:
 * This component allows users to fill out a form and book an interview by selecting a date and time.
 */
const InterviewBooking: React.FC = () => {
  // ------------------------------
  // State Definitions
  // ------------------------------

  // Form data populated from login data + user inputs
  const [formData, setFormData] = useState({
    firstName: loginUser.firstName || "",
    lastName: loginUser.lastName || "",
    email: "",
    phone: "",
    date: "",
    time: "",
    notes: "",
  });

  // Error and success message states
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Animation state for initial fade-in effect
  const [loaded, setLoaded] = useState(false);

  // ------------------------------
  // Effects
  // ------------------------------

  // Trigger fade-in animation on first render
  useEffect(() => {
    setLoaded(true);
  }, []);

  // ------------------------------
  // Handlers
  // ------------------------------

  /**
   * Handles changes to form inputs and updates corresponding state.
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    setSuccess(false);
  };

  /**
   * Handles form submission, logs the data, and shows a success message.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
    console.log("Form submitted successfully!");
    console.log(JSON.stringify(formData, null, 2));
  };

  /**
   * Resets all form fields and clears state flags.
   */
  const handleReset = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      date: "",
      time: "",
      notes: "",
    });
    setError("");
    setSuccess(false);
  };

  // ------------------------------
  // Render
  // ------------------------------
  return (
    <form
      onSubmit={handleSubmit}
      className={`min-h-screen bg-white px-6 py-10 ${loaded ? "opacity-100" : "translate-y-4 opacity-0"
        } mx-auto w-full rounded-xl shadow-lg transition-all duration-700 md:w-3/4`}
    >
      {/* Heading */}
      <h1 className="text-5xl font-extrabold mb-8 text-center mt-10">
        Book Your Interview
      </h1>

      {/* Date & Time Picker */}

      <BookingCalendar
        onDateTimeSelect={(date, time) =>
          setFormData((prev) => ({ ...prev, date, time }))
        }
        formData={formData}
        handleChange={handleChange}
      />


      {/* Success & Error Alerts */}
      <div className="mx-auto my-10 max-w-3xl">
        {success && (
          <div className="animate-fade-in mb-4 flex items-center gap-3 rounded-lg border border-green-300 bg-green-50 p-4 text-green-800 shadow-sm">
            <span className="text-xl">✅</span>
            <div className="text-sm font-medium">
              Interview successfully booked! We’ll be in touch soon. 🎉
            </div>
          </div>
        )}
        {error && (
          <div className="animate-shake mb-4 flex items-center gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800 shadow-sm">
            <span className="text-xl">⚠️</span>
            <div className="text-sm font-medium">
              Something went wrong. Please try again.
            </div>
          </div>
        )}
      </div>

      {/* Submit & Reset Buttons */}
      <div className="mb-20 mt-6 flex flex-col items-center justify-center">
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
          <button
            type="submit"
            className="w-full rounded-xl border border-black px-6 py-3 font-semibold text-black shadow-sm bg-black text-white focus:outline-none focus:ring-1 focus:ring-black sm:w-auto"
          >
            Submit Booking
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="w-full rounded-xl border border-red-300 bg-white px-6 py-3 font-semibold text-red-600 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-1 focus:ring-red-300 sm:w-auto"
          >
            Reset Form
          </button>
        </div>
      </div>
    </form>

  );
};

export default InterviewBooking;
