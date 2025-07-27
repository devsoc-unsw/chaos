import React, { useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Maximize2 } from "lucide-react";

// Mock question components (you would replace these with your actual imports)
const ShortAnswer: React.FC<{
  id: number;
  question: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  onSubmit: (id: number, value: string) => void;
}> = ({ id, question, placeholder, required, defaultValue, onSubmit }) => {
  const [value, setValue] = useState(defaultValue || "");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onSubmit(id, newValue);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {question} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        required={required}
      />
    </div>
  );
};

const MultiChoice: React.FC<{
  id: number;
  question: string;
  options: string[];
  required?: boolean;
  defaultValue?: string;
  onSubmit: (id: number, value: string) => void;
}> = ({ id, question, options, required, defaultValue, onSubmit }) => {
  const [selectedValue, setSelectedValue] = useState(defaultValue || "");

  const handleChange = (value: string) => {
    setSelectedValue(value);
    onSubmit(id, value);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {question} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="space-y-2">
        {options.map((option, index) => (
          <label key={index} className="flex items-center">
            <input
              type="radio"
              name={`question-${id}`}
              value={option}
              checked={selectedValue === option}
              onChange={(e) => handleChange(e.target.value)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

const DevsocRecruitmentForm: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'general' | 'review'>('general');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [answers, setAnswers] = useState<{ [key: number]: any }>({});

  const handleAnswerSubmit = (questionId: number, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const roles = [
    {
      name: 'Marketing',
      description: 'Social media, content creation, and promotional campaigns',
      color: 'bg-purple-100 border-purple-300 text-purple-800'
    },
    {
      name: 'Events',
      description: 'Workshop planning, hackathons, and networking events',
      color: 'bg-blue-100 border-blue-300 text-blue-800'
    },
    {
      name: 'Education',
      description: 'Technical workshops and mentorship programs',
      color: 'bg-green-100 border-green-300 text-green-800'
    },
    {
      name: 'Industry',
      description: 'Corporate partnerships and sponsorship management',
      color: 'bg-orange-100 border-orange-300 text-orange-800'
    },
    {
      name: 'Design',
      description: 'Visual content, branding, and user experience',
      color: 'bg-pink-100 border-pink-300 text-pink-800'
    },
    {
      name: 'IT',
      description: 'Technical infrastructure and development',
      color: 'bg-indigo-100 border-indigo-300 text-indigo-800'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Browser Header */}
      <div className="bg-gray-800 text-white px-4 py-2 flex items-center gap-4">
        <div className="flex gap-2">
          <button className="text-gray-400 hover:text-white">
            <ChevronLeft size={20} />
          </button>
          <button className="text-gray-400 hover:text-white">
            <ChevronRight size={20} />
          </button>
          <button className="text-gray-400 hover:text-white">
            <RotateCcw size={18} />
          </button>
        </div>
        <div className="bg-gray-700 text-gray-300 px-4 py-1 rounded flex-1 max-w-md">
          /campaign/1/apply
        </div>
        <button className="text-gray-400 hover:text-white ml-auto">
          <Maximize2 size={18} />
        </button>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            2025 DevSoc Subcommittee Recruitment
          </h1>
          <p className="text-gray-600">1 Feb 2025 - 20 Feb 2025</p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-80">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Available Roles</h2>
            <div className="space-y-3">
              {roles.map((role) => (
                <div
                  key={role.name}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedRole === role.name
                      ? role.color
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedRole(role.name)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{role.name}</h3>
                    <button className="text-gray-400 hover:text-gray-600">
                      <span className="text-lg">+</span>
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">{role.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-8">
              <button
                className={`px-6 py-3 font-medium ${
                  currentTab === 'general'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setCurrentTab('general')}
              >
                General
              </button>
              <button
                className={`px-6 py-3 font-medium ${
                  currentTab === 'review'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setCurrentTab('review')}
              >
                Review
              </button>
            </div>

            {/* Form Content */}
            {currentTab === 'general' && (
              <div className="bg-white rounded-lg p-8 shadow-sm">
                <div className="space-y-6">
                  {/* Name */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Name</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <ShortAnswer
                        id={1}
                        question="First Name"
                        placeholder="First Name"
                        required={true}
                        onSubmit={handleAnswerSubmit}
                      />
                      <ShortAnswer
                        id={2}
                        question="Last Name"
                        placeholder="Last Name"
                        required={true}
                        onSubmit={handleAnswerSubmit}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <ShortAnswer
                    id={3}
                    question="Email"
                    placeholder="your.email@example.com"
                    required={true}
                    onSubmit={handleAnswerSubmit}
                  />

                  {/* zID */}
                  <ShortAnswer
                    id={4}
                    question="zID"
                    placeholder="z1234567"
                    required={true}
                    onSubmit={handleAnswerSubmit}
                  />

                  {/* Degree */}
                  <ShortAnswer
                    id={5}
                    question="Degree"
                    placeholder="e.g., Computer Science"
                    required={true}
                    onSubmit={handleAnswerSubmit}
                  />

                  {/* Phone Number */}
                  <ShortAnswer
                    id={6}
                    question="Phone Number"
                    placeholder="+61 xxx xxx xxx"
                    required={false}
                    onSubmit={handleAnswerSubmit}
                  />

                  {/* Gender */}
                  <MultiChoice
                    id={7}
                    question="Gender"
                    options={['Male', 'Female', 'Prefer not to say']}
                    required={false}
                    onSubmit={handleAnswerSubmit}
                  />
                </div>
              </div>
            )}

            {currentTab === 'review' && (
              <div className="bg-white rounded-lg p-8 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Review Your Application</h3>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-medium mb-2">Selected Role</h4>
                    <p className="text-gray-700">{selectedRole || 'No role selected'}</p>
                  </div>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-medium mb-2">Form Responses</h4>
                    <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                      {JSON.stringify(answers, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevsocRecruitmentForm;