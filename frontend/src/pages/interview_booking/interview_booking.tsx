import React, { useState } from "react";

const InterviewBooking: React.FC = () => {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        date: "",
        time: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Submitted JSON:", JSON.stringify(formData, null, 2));
        alert("Check the console for submitted JSON data!");
    };

    return (
        <form onSubmit={handleSubmit} className="min-h-screen bg-white px-6 py-10 w-full">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">
                    Book an Interview
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Side - Input Fields */}
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                                First Name
                            </label>
                            <input
                                type="text"
                                id="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                placeholder="John"
                            />

                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1 mt-4">
                                Last Name
                            </label>
                            <input
                                type="text"
                                id="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                placeholder="Doe"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                placeholder="john@example.com"
                            />
                        </div>
                    </div>

                    {/* Right Side - Date/Time and Submit Button */}
                    <div className="md:col-span-2 bg-gray-50 border border-gray-200 rounded-md p-6 shadow-sm space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                                    Interview Date
                                </label>
                                <input
                                    type="date"
                                    id="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                                    Start Time
                                </label>
                                <input
                                    type="time"
                                    id="time"
                                    value={formData.time}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="mt-4 w-full md:w-auto bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-md font-medium focus:ring-2 focus:ring-green-400 focus:outline-none"
                        >
                            Book Interview
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default InterviewBooking;
