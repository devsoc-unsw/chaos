import Box from "@mui/material/Box";
import { useEffect, useState } from "react";

import BookingCalendar from "./booking_calendar.component";
import loginUser from "./login_user.json";

import type React from "react";

// Interface representing a single available time slot
interface Slot {
  date: string;
  time: string;
}

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
      className={`min-h-screen bg-white px-6 py-10 ${
        loaded ? "opacity-100" : "translate-y-4 opacity-0"
      } mx-auto w-full rounded-xl shadow-lg transition-all duration-700 md:w-3/4`}
    >
      {/* Heading */}
      <h1 className="text-5xl font-extrabold mb-8 text-center mt-10">
        Book Your Interview
      </h1>

      {/* Personal Info Card */}
      <div className="mx-auto my-8 mb-10 max-w-3xl transform space-y-6 rounded-2xl border-2 border-indigo-400 bg-white p-8 shadow-2xl transition-all duration-500 hover:scale-[1.01] hover:shadow-purple-500/30">
        <div>
          <h2 className="mb-2 text-3xl font-bold tracking-tight text-gray-800">
            {formData.firstName} {formData.lastName || "🧑"}
          </h2>
          <p className="text-sm italic text-gray-500">
            Please confirm your contact information. We’ll reach out to you via
            email or phone.
          </p>
        </div>

        {/* Email and Phone Inputs */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              required
              value={formData.email}
              placeholder="johndoe2005@gmail.com"
              onChange={handleChange}
              className="w-full rounded-md border border-indigo-300 px-4 py-2 text-sm shadow transition-all duration-200 focus:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
          <div>
            <label
              htmlFor="phone"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              required
              value={formData.phone}
              placeholder="+61 400 123 456"
              onChange={handleChange}
              className="w-full rounded-md border border-indigo-300 px-4 py-2 text-sm shadow transition-all duration-200 focus:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
        </div>
      </div>

      {/* Notes Section */}
      <div className="mx-auto my-6 mb-10 max-w-3xl rounded-xl border border-gray-300 bg-gradient-to-br from-white via-gray-50 to-purple-50 p-6 shadow-lg transition duration-300 ease-in-out hover:shadow-lg hover:shadow-purple-300/50">
        <h3 className="mb-3 flex items-center gap-2 text-xl font-bold text-purple-700">
          Additional Notes
        </h3>
        <textarea
          id="notes"
          placeholder="Enter any specific notes or requests... e.g. 'Please don’t call during math class'"
          value={formData.notes}
          onChange={handleChange}
          className="w-full rounded-md border border-indigo-200 px-4 py-3 text-sm transition-all focus:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-300"
          rows={4}
        />
      </div>

      {/* Date & Time Picker */}
      <Box className="mt-30 border-300 overflow-hidden rounded-xl border shadow-lg transition-all duration-500 hover:shadow-purple-300/50">
        <BookingCalendar
          onDateTimeSelect={(date, time) =>
            setFormData((prev) => ({ ...prev, date, time }))
          }
        />
      </Box>

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
