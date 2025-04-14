import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import slotData from "./availableTimeSlots.json";

// Interface for time slot structure
interface Slot {
  date: string;
  time: string;
}

const InterviewBooking: React.FC = () => {
  // ------------------------------
  // State Definitions
  // ------------------------------
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    notes: ""
  });

  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [error, setError] = useState("");     // Display validation error if any
  const [success, setSuccess] = useState(false); // Trigger confirmation view
  const [loaded, setLoaded] = useState(false); // Track component load state
    useEffect(() => {
    setLoaded(true);
    }, []);

  // ------------------------------
  // Fetch available time slots on mount
  // ------------------------------
  useEffect(() => {
    setAvailableSlots(slotData);
  }, []);

  // ------------------------------
  // Extract all unique available dates
  // ------------------------------
  const availableDates = Array.from(
    new Set(availableSlots.map((slot) => slot.date))
  ).map((dateStr) => new Date(dateStr));

  // ------------------------------
  // Handlers
  // ------------------------------

  // Update formData on date change and reset time
  const handleDateChange = (date: Date | null) => {
    const dateStr = date?.toISOString().split("T")[0] ?? "";
    setFormData((prev) => ({ ...prev, date: dateStr, time: "" }));
    setSuccess(false); // Hide confirmation if user changes selection
  };

  // General form field change handler
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    setSuccess(false); // Reset success flag on user input
  };

  // Validate time slot and handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if selected slot is actually available
    const isAvailable = availableSlots.some(
      (slot) => slot.date === formData.date && slot.time === formData.time
    );

    if (!isAvailable) {
      setError("Selected date/time is not available.");
      setSuccess(false);
      return;
    }

    setError("");
    setSuccess(true);
    console.log("Submitted JSON:", JSON.stringify(formData, null, 2));
  };

  // Clear form fields and reset state
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
  // Component UI
  // ------------------------------
  return (

    <form onSubmit={handleSubmit} className={`min-h-screen bg-white px-6 py-10 w-3/4 mx-auto shadow-lg rounded-xl transition-all duration-700 ${loaded ? "opacity-100" : "opacity-0 translate-y-4"}`}> 
        <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-8 font-mono">
            Book an Interview 
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* ------------------------------
                Left Panel — Personal Info
            ------------------------------ */}
            <div className="space-y-6">
                <div>
                <label htmlFor="firstName" className="block text-md font-medium">
                    First Name
                </label>
                <input
                    type="text"
                    id="firstName"
                    placeholder="John"
                    required={true}
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-md"
                />

                <label htmlFor="lastName" className="block text-md font-medium mt-4">
                    Last Name
                </label>
                <input
                    type="text"
                    id="lastName"
                    placeholder="Doe"
                    required={true}
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-md"
                />
                </div>

                <div>
                <label htmlFor="email" className="block text-md font-medium">
                    Email Address
                </label>
                <input
                    type="email"
                    id="email"
                    placeholder="johndoe2005@gmail.com"
                    value={formData.email}
                    required={true}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-md"
                />
                </div>

                <div>
                <label htmlFor="phone" className="block text-md font-medium">
                    Phone Number
                </label>
                <input
                    type="tel"
                    id="phone"
                    required={true}
                    placeholder="+61 400 123 456"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-md"
                />
                </div>
            </div>

            {/* ------------------------------
                Right Panel — Schedule & Notes
            ------------------------------ */}
            <div className="w-full md:w-auto md:col-span-2 bg-gray-50 border border-gray-200 md:ml-20 rounded-md p-6 shadow-sm space-y-4">

                {/* Date and Time Slot Picker */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-md font-medium">Interview Date</label>
                    <DatePicker
                    selected={formData.date ? new Date(formData.date) : null}
                    onChange={handleDateChange}
                    includeDates={availableDates}
                    placeholderText="Select an available date"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-md"
                    dateFormat="yyyy-MM-dd"
                    />
                </div>

                <div>
                    <label className="block text-md font-medium mb-1">Start Time</label>
                    <div className="grid grid-cols-2 gap-2">
                    {/* Render time slots for selected date */}
                    {formData.date &&
                        availableSlots
                        .filter((slot) => slot.date === formData.date)
                        .map((slot, i) => {
                            const isSelected = formData.time === slot.time;
                            return (
                            <button
                                key={i}
                                type="button"
                                onClick={() =>
                                setFormData((prev) => ({ ...prev, time: slot.time }))
                                }
                                className={`px-4 py-2 rounded-md border text-md transition ring-offset-1 focus:ring-1 ${
                                    isSelected
                                      ? "bg-green-600 text-white border-green-700 ring-2 ring-green-400"
                                      : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100"
                                  }`}
                            >
                                {slot.time}
                            </button>
                            );
                        })}

                    {/* Prompt if no date is selected */}
                    {!formData.date && (
                        <p className="text-gray-500 text-md col-span-2">
                        Select a date to view available times.
                        </p>
                    )}
                    </div>
                </div>
                </div>

                {/* Additional Notes */}
                <div className="col-span-2">
                <label htmlFor="notes" className="block text-md font-medium">
                    Additional Notes
                </label>
                <textarea
                    id="notes"
                    rows={3}
                    placeholder="Anything you'd like us to know before the interview?"
                    value={formData.notes}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-md"
                />
                </div>

                {/* Error Message */}
                {error && (
                <p className="text-red-500 text-md font-medium">{error}</p>
                )}

                {/* Form Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-md font-medium"
                >
                    Book Interview
                </button>
                <button
                    type="button"
                    onClick={handleReset}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-6 rounded-md font-medium"
                >
                    Reset Form
                </button>
                </div>
            </div>
            </div>

            {/* ------------------------------
                Success Confirmation Summary
            ------------------------------ */}
            {success && (
            <div className="mt-10 bg-green-50 border border-green-200 rounded-2xl shadow-sm px-6 py-6 font-mono">
                <h2 className="text-xl font-semibold text-green-800 mb-4">✅ Booking Confirmed!</h2>
                <p className="text-md text-green-700 mb-4">
                Your interview has been successfully booked. Here's a summary of your booking:
                </p>
                <ul className="space-y-3 text-md text-gray-800">
                <li className="flex items-start">
                    <span className="font-medium w-24">Name:</span>
                    <span>{formData.firstName} {formData.lastName}</span>
                </li>
                <li className="flex items-start">
                    <span className="font-medium w-24">Email:</span>
                    <span>{formData.email}</span>
                </li>
                <li className="flex items-start">
                    <span className="font-medium w-24">Phone:</span>
                    <span>{formData.phone || "—"}</span>
                </li>
                <li className="flex items-start">
                    <span className="font-medium w-24">Date:</span>
                    <span>{formData.date || "—"}</span>
                </li>
                <li className="flex items-start">
                    <span className="font-medium w-24">Time:</span>
                    <span>{formData.time || "—"}</span>
                </li>
                <li className="flex items-start">
                    <span className="font-medium w-24">Notes:</span>
                    <span>{formData.notes || "—"}</span>
                </li>
                </ul>
            </div>
            )}
        </div>
    </form>
  );
};

export default InterviewBooking;
