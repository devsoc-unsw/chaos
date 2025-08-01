# Admin Application Dashboard

A React component for reviewing and managing job applications for DevSoc Executive Recruitment 2024.

## Features

- **Application Review**: View and rate applications with star ratings and comments
- **Filtering**: Search by name, email, zID, role, and status
- **Selection Management**: Checkbox selection with localStorage persistence (24h timeout)
- **AI Integration**: Modal-based AI assistant (currently shows motivational message)
- **Responsive Design**: Works on desktop and mobile devices

## Files

- `index.tsx` - Main dashboard component
- `mockApplications.json` - Sample application data
- `mockRoleNames.json` - Role name mappings
- `mockAIMessage.json` - Initial AI messages

The dashboard allows admins to:
1. View all applications with filtering options
2. Select applications using checkboxes (persisted in localStorage)
3. Review individual applications with ratings and comments
4. Access AI assistant for motivational reminders
5. Navigate to interview management

## Data Structure

Applications include:
- Personal information (name, email, zID, degree, year)
- Applied roles with preferences
- Motivation statement
- Role-specific answers
- Review status and ratings 