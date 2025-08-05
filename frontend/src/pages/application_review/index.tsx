/**
 * DevsocRecruitmentForm Component
 *
 * This component displays a dynamic recruitment form that loads campaign data and roles from the API.
 * It implements a fallback system to ensure the form always works, even when the API is unavailable.
 *
 * HOW IT WORKS:
 * 1. Extracts campaignId from URL params (e.g., /campaign/1/apply)
 * 2. Falls back to campaignId "1" if no ID is provided in the URL
 * 3. Attempts to fetch real data from two API endpoints:
 *    - GET /api/v1/campaigns/{campaignId} (for campaign details: name, dates)
 *    - GET /api/v1/campaigns/{campaignId}/roles (for available roles)
 * 4. If API calls fail, gracefully falls back to hardcoded mock data
 * 5. Shows a loading spinner while fetching data
 * 6. Displays a warning banner when using fallback campaignId
 *
 * API INTEGRATION:
 * - Based on endpoints from PR #562: https://github.com/devsoc-unsw/chaos/pull/562/files
 * - Maps API response formats to structures
 * - Automatically assigns colors to API roles
 * - Converts ISO date strings to display format
 *
 * FALLBACK SYSTEM:
 * - Mock campaigns with different dates and titles for testing
 * - Predefined roles with descriptions and color schemes
 * - Ensures form is always functional during development
 * - Console logging helps identify when fallback is being used
 *
 * URL PATTERNS:
 * - /campaign/1/apply → Real API data for campaign 1 (or fallback)
 * - /campaign/2/apply → Real API data for campaign 2 (or fallback)
 */
import React, { useState, useEffect } from "react";
import { useParams } from 'react-router-dom';
import ShortAnswer from "components/QuestionComponents/ShortAnswer";
import Dropdown from "components/QuestionComponents/Dropdown";
import MultiChoice from "components/QuestionComponents/MultiChoice";
import MultiSelect from "components/QuestionComponents/MultiSelect";
import Ranking from "components/QuestionComponents/Ranking";

// Types for API responses
interface ApiRole {
  id: number;
  name: string;
  description: string;
  min_available: number;
  max_available: number;
  finalised: boolean;
}

interface ApiCampaign {
  id: number;
  name: string;
  description?: string;
  starts_at: string;
  ends_at: string;
}

// Local role interface for UI
interface Role {
  name: string;
  description: string;
  color: string;
}

// Campaign interface for UI
interface Campaign {
  title: string;
  startDate: string;
  endDate: string;
}

const DevsocRecruitmentForm: React.FC = () => {
    // Get the campaignId from the URL parameters
    const { campaignId } = useParams<{ campaignId: string }>();

    // Fallback to a default campaign ID 1 if none is provided
    const activeCampaignId = campaignId || "1";

    const [currentTab, setCurrentTab] = useState<'general' | 'review'>('general');
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [answers, setAnswers] = useState<{ [key: number]: any }>({});
    const [showCampaignWarning, setShowCampaignWarning] = useState(!campaignId);

    // New state for dynamic data
    const [campaignData, setCampaignData] = useState<Campaign | null>(null);
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fallback campaign data
    const getFallbackCampaignData = (id: string): Campaign => {
        const campaigns = {
            "1": {
                title: "2025 DevSoc Subcommittee Recruitment",
                startDate: "2025-02-01",
                endDate: "2025-02-20"
            },
            "2": {
                title: "2025 Summer Internship Program",
                startDate: "2025-03-01",
                endDate: "2025-03-15"
            },
            "3": {
                title: "2025 Winter Workshop Series",
                startDate: "2025-07-01",
                endDate: "2025-07-31"
            }
        };

        return campaigns[id] || campaigns["1"];
    };

    // Fallback roles data
    const getFallbackRoles = (): Role[] => {
        return [
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
    };

    // API functions
    const fetchCampaignData = async (campaignId: string): Promise<Campaign> => {
        const response = await fetch(`/api/v1/campaigns/${campaignId}`);
        if (!response.ok) throw new Error('Failed to fetch campaign');
        const apiCampaign: ApiCampaign = await response.json();

        return {
            title: apiCampaign.name,
            startDate: apiCampaign.starts_at.split('T')[0], // Convert ISO to YYYY-MM-DD
            endDate: apiCampaign.ends_at.split('T')[0]
        };
    };

    const fetchCampaignRoles = async (campaignId: string): Promise<Role[]> => {
        const response = await fetch(`/api/v1/campaigns/${campaignId}/roles`);
        if (!response.ok) throw new Error('Failed to fetch roles');
        const apiRoles: ApiRole[] = await response.json();

        // Color palette for roles
        const colors = [
            'bg-purple-100 border-purple-300 text-purple-800',
            'bg-blue-100 border-blue-300 text-blue-800',
            'bg-green-100 border-green-300 text-green-800',
            'bg-orange-100 border-orange-300 text-orange-800',
            'bg-pink-100 border-pink-300 text-pink-800',
            'bg-indigo-100 border-indigo-300 text-indigo-800',
            'bg-red-100 border-red-300 text-red-800',
            'bg-yellow-100 border-yellow-300 text-yellow-800'
        ];

        return apiRoles.map((role, index) => ({
            name: role.name,
            description: role.description,
            color: colors[index % colors.length]
        }));
    };

    // Format date range helper
    const formatDateRange = (startDate: string, endDate: string): string => {
        const start = new Date(startDate);
        const end = new Date(endDate);

        const options: Intl.DateTimeFormatOptions = {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        };

        const startFormatted = start.toLocaleDateString('en-AU', options);
        const endFormatted = end.toLocaleDateString('en-AU', options);

        return `${startFormatted} - ${endFormatted}`;
    };

    // Load data on component mount or when campaignId changes
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                console.log('Fetching data for campaign:', activeCampaignId);

                const [campaign, campaignRoles] = await Promise.all([
                    fetchCampaignData(activeCampaignId),
                    fetchCampaignRoles(activeCampaignId)
                ]);

                setCampaignData(campaign);
                setRoles(campaignRoles);
                console.log('Successfully loaded campaign data from API');

            } catch (error) {
                console.warn('Failed to load campaign data from API, using fallback:', error);

                // Use fallback data
                setCampaignData(getFallbackCampaignData(activeCampaignId));
                setRoles(getFallbackRoles());
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [activeCampaignId]);

    const handleAnswerSubmit = (questionId: number, value: any) => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: value,
        }));
    };

    const sampleOptions = [
        { id: 1, label: "Option 1" },
        { id: 2, label: "Option 2" },
        { id: 3, label: "Option 3" },
        { id: 4, label: "Option 4" },
    ];

    // Show loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading campaign data...</p>
                </div>
            </div>
        );
    }

    // Use fallback if no data loaded
    const currentCampaign = campaignData || getFallbackCampaignData(activeCampaignId);
    const currentRoles = roles.length > 0 ? roles : getFallbackRoles();

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="w-full mx-auto p-8">
                {/* Campaign Warning Banner */}
                {showCampaignWarning && (
                    <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-yellow-800">
                                    Demo Mode
                                </h3>
                                <div className="mt-2 text-sm text-yellow-700">
                                    <p>
                                        No campaign ID found in URL. Using default campaign ID "{activeCampaignId}" for testing.
                                        <br />
                                        <span className="font-medium">Expected URL format:</span> /campaign/[campaignId]/apply
                                    </p>
                                </div>
                                <div className="mt-4">
                                    <button
                                        type="button"
                                        className="bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 rounded hover:bg-yellow-200"
                                        onClick={() => setShowCampaignWarning(false)}
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header - NOW DYNAMIC */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {currentCampaign.title}
                    </h1>
                    <p className="text-gray-600">
                        {formatDateRange(currentCampaign.startDate, currentCampaign.endDate)}
                    </p>
                </div>

                <div className="flex gap-8 w-full">
                    {/* Sidebar - NOW DYNAMIC ROLES */}
                    <div className="w-80 flex-shrink-0">
                        <h2 className="text-xl font-semibold mb-4 text-gray-900">Available Roles</h2>
                        <div className="space-y-3">
                            {currentRoles.map((role) => (
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
                                                width="w-full"
                                                onSubmit={handleAnswerSubmit}
                                            />
                                            <ShortAnswer
                                                id={2}
                                                question="Last Name"
                                                placeholder="Last Name"
                                                required={true}
                                                width="w-full"
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
                                        width="w-full"
                                        onSubmit={handleAnswerSubmit}
                                    />

                                    {/* zID */}
                                    <ShortAnswer
                                        id={4}
                                        question="zID"
                                        placeholder="z1234567"
                                        required={true}
                                        width="w-full"
                                        onSubmit={handleAnswerSubmit}
                                    />

                                    {/* Degree */}
                                    <ShortAnswer
                                        id={5}
                                        question="Degree"
                                        placeholder="e.g., Computer Science"
                                        required={true}
                                        width="w-full"
                                        onSubmit={handleAnswerSubmit}
                                    />

                                    {/* Phone Number */}
                                    <ShortAnswer
                                        id={6}
                                        question="Phone Number"
                                        placeholder="+61 xxx xxx xxx"
                                        required={false}
                                        width="w-full"
                                        onSubmit={handleAnswerSubmit}
                                    />

                                    {/* Gender */}
                                    <MultiChoice
                                        id={7}
                                        question="Gender"
                                        options={sampleOptions}
                                        required={false}
                                        onSubmit={handleAnswerSubmit}
                                    />
                                    <Dropdown
                                        id={8}
                                        question="What is your preferred programming language?"
                                        description="Select one option from the dropdown"
                                        options={sampleOptions}
                                        required={true}
                                        defaultValue={answers[2]}
                                        onSubmit={handleAnswerSubmit}
                                    />
                                    <MultiSelect
                                        id={9}
                                        question="Which technologies are you familiar with?"
                                        description="Select all that apply"
                                        options={sampleOptions}
                                        required={true}
                                        defaultValue={answers[4] || []}
                                        onSubmit={handleAnswerSubmit}
                                    />
                                    <Ranking
                                        id={10}
                                        question="Rank your preference for the following options"
                                        description="Drag and drop options to your preferences"
                                        options={sampleOptions}
                                        required={true}
                                        defaultValue={answers[5] || []}
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