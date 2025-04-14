import React, { useState, useEffect } from "react";
import "react-datepicker/dist/react-datepicker.css";
import BookingCalendar from "./booking_calendar.component";
import loginUser from './login_user.json';
import Alert from '@mui/material/Alert';
import CheckIcon from '@mui/icons-material/Check';

// Interface for a time slot
interface Slot {
  date: string;
  time: string;
}

const InterviewBooking2: React.FC = () => {
  // ------------------------------
  // State Definitions
  // ------------------------------
  const [formData, setFormData] = useState({
    firstName: loginUser.firstName || "",
    lastName: loginUser.lastName || "",
    email: "",
    phone: "",
    date: "",
    time: "",
    notes: ""
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loaded, setLoaded] = useState(false);
  

  // Trigger initial UI animation
  useEffect(() => {
    setLoaded(true);
  }, []);

  // ------------------------------
  // Handlers
  // ------------------------------

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    setSuccess(false);
  };

  // Handle booking submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
    console.log("Form submitted successfully!");
    console.log(JSON.stringify(formData, null, 2));
  };

  // Reset form to initial state
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
  // Component Render
  // ------------------------------
  return (
    <form onSubmit={handleSubmit} className={`min-h-screen bg-white px-6 py-10 w-3/4 mx-auto shadow-lg rounded-xl transition-all duration-700 ${loaded ? "opacity-100" : "opacity-0 translate-y-4"}`}> 
      {/* Header */}
      <h1 className="text-4xl flex justify-center mb-10 font-semibold font-mono text-gray-800 mb-4 md:mb-0">
        Book Your Interview
      </h1>
      {/* Personal Info Card */}
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg border border-gray-500 p-6 my-6 space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            {formData.firstName} {formData.lastName}
          </h2>
          <p className="text-gray-500 text-sm">Please confirm your contact information.</p>
        </div>

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
              className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Additional Info Card (e.g. Notes) */}
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow border border-gray-200 p-6 my-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Additional Notes</h3>
        <textarea
          id="notes"
          placeholder="Enter any specific notes or requests..."
          value={formData.notes}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
        />
      </div>

      {/* Date & Time Picker Section */}
      <div className="border border-gray-300 w-auto mx-10 rounded-lg my-8">
        <BookingCalendar
          onDateTimeSelect={(date, time) =>
            setFormData((prev) => ({ ...prev, date, time }))
          }
        />
      </div>

      
      {/* Confirmation Alert */}
      <div className="max-w-3xl mx-auto">
        {success && (
            <Alert severity="success">
            Here is a gentle confirmation that your action was successful.
          </Alert>
          )}
        {error && (
            <Alert severity="error">
            Here is a gentle confirmation that your action was not successful.
          </Alert>
        )}
      </div>
      {/* Submit and Reset Buttons */}
      <div className="flex flex-col items-center justify-center mb-10 mt-6">
          
        <div className="flex gap-4">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-md shadow-sm transition"
          >
            Submit Booking
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium px-6 py-2 rounded-md shadow-sm transition"
          >
            Reset
          </button>
        </div>
        
      </div>
    </form>
  );
};

export default InterviewBooking2;
