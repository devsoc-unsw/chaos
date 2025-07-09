# Admin Interview Booking System - Backend Integration
To run this component, run 'npm yarn start', the page is at '/admin-interview-booking'



## Required Endpoints
- This admin page requires ROLES, LOCATIONS, and the CURRENT_USER_INFO
For example,
  ```javascript
  const ROLES = [
    "Technical Director",
    "Operations Director", 
  ]

  const LOCATIONS = [
      "Room 101 - Main Building",
      "Room 102 - Main Building", 
      "Other"
  ];

  const CURRENT_USER = { id: "admin1", name: "Kavika" };
  ```
