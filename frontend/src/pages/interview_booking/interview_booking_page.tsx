import React, { useState, useEffect } from "react";
import "react-datepicker/dist/react-datepicker.css";
import BookingCalendar from "./booking_calendar.component";
import loginUser from './login_user.json';
import Box from "@mui/material/Box";

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
    notes: ""
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
      notes: ""
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
        loaded ? "opacity-100" : "opacity-0 translate-y-4"
      } w-full md:w-3/4 mx-auto shadow-lg rounded-xl transition-all duration-700`}
    >
      {/* Heading */}
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-mono text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse mb-10">
        Book Your Interview
      </h1>

      {/* Personal Info Card */}
      <div className="mb-10 max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl border-2 border-indigo-400 p-8 my-8 space-y-6 transform transition-all duration-500 hover:scale-[1.01] hover:shadow-purple-500/30">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2 tracking-tight">
            {formData.firstName} {formData.lastName || "🧑"}
          </h2>
          <p className="text-gray-500 text-sm italic">
            Please confirm your contact information. We’ll reach out to you via email or phone.
          </p>
        </div>

        {/* Email and Phone Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              required
              value={formData.email}
              placeholder="johndoe2005@gmail.com"
              onChange={handleChange}
              className="w-full border border-indigo-300 rounded-md px-4 py-2 text-sm shadow focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-200 focus:scale-105"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              required
              value={formData.phone}
              placeholder="+61 400 123 456"
              onChange={handleChange}
              className="w-full border border-indigo-300 rounded-md px-4 py-2 text-sm shadow focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-200 focus:scale-105"
            />
          </div>
        </div>
      </div>

      {/* Notes Section */}
      <div className="mb-10 max-w-3xl mx-auto bg-gradient-to-br from-white via-gray-50 to-purple-50 rounded-xl shadow-lg border border-gray-300 p-6 my-6 transition duration-300 ease-in-out hover:shadow-lg hover:shadow-purple-300/50">
        <h3 className="text-xl font-bold text-purple-700 mb-3 flex items-center gap-2">
          Additional Notes
        </h3>
        <textarea
          id="notes"
          placeholder="Enter any specific notes or requests... e.g. 'Please don’t call during math class'"
          value={formData.notes}
          onChange={handleChange}
          className="w-full border border-indigo-200 rounded-md px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:scale-105 transition-all"
          rows={4}
        />
      </div>

      {/* Date & Time Picker */}
      <Box className="mt-30 rounded-xl border border-300 shadow-lg overflow-hidden transition-all duration-500 hover:shadow-purple-300/50">
        <BookingCalendar
          onDateTimeSelect={(date, time) =>
            setFormData((prev) => ({ ...prev, date, time }))
          }
        />
      </Box>

      {/* Success & Error Alerts */}
      <div className="max-w-3xl mx-auto my-10">
        {success && (
          <div className="flex items-center gap-3 p-4 mb-4 rounded-lg border border-green-300 bg-green-50 text-green-800 shadow-sm animate-fade-in">
            <span className="text-xl">✅</span>
            <div className="text-sm font-medium">
              Interview successfully booked! We’ll be in touch soon. 🎉
            </div>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-3 p-4 mb-4 rounded-lg border border-red-300 bg-red-50 text-red-800 shadow-sm animate-shake">
            <span className="text-xl">⚠️</span>
            <div className="text-sm font-medium">
              Something went wrong. Please try again.
            </div>
          </div>
        )}
      </div>

      {/* Submit & Reset Buttons */}
      <div className="flex flex-col items-center justify-center mb-20 mt-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
          <button
            type="submit"
            className="w-full sm:w-auto bg-gradient-to-r from-indigo-200 to-purple-300 inner-shadow-lg hover:shadow-lg hover:scale-101 transition-all duration-300 hover:brightness-100 text-white font-semibold px-6 py-3 rounded-xl shadow-md focus:ring-1 focus:ring-purple-400"
          >
            Submit Booking
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="w-full sm:w-auto bg-white hover:bg-red-50 text-red-600 font-semibold px-6 py-3 rounded-xl border border-red-300 shadow-sm focus:outline-none focus:ring-1 focus:ring-red-300"
          >
            Reset Form
          </button>
        </div>
      </div>
    </form>
  );
};

export default InterviewBooking;
