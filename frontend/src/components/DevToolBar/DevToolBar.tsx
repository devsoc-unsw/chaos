// Read from .env.development to enable DevToolBar
// This component will be render as a horizontal toolbar at the bottom of the screen
// Has thre buttons that just calls the backend dev APIs for test user logins/logout

import React from "react";
import tw from "twin.macro";

const DevToolBar: React.FC = () => {
    const handleLoginAsUser = () => {
        // Navigate the top-level window to the backend login endpoint so the browser
        // performs the full navigation and follows the redirect to the frontend dashboard.
        // This avoids CORS errors that occur when fetch() encounters a cross-origin redirect.
        window.location.assign(`${import.meta.env.VITE_API_BASE_URL}/api/v1/dev/user_login`);
    };

    const handleLoginAsAdmin = () => {
        window.location.assign(`${import.meta.env.VITE_API_BASE_URL}/api/v1/dev/org_admin_login`);
    };
    
    const handleLoginAsSuperAdmin = () => {
        window.location.assign(`${import.meta.env.VITE_API_BASE_URL}/api/v1/dev/super_admin_login`);
    };

    const devToolbarEnabled = import.meta.env.VITE_DEV_TOOLBAR === "true";

    return (
        <>
            {devToolbarEnabled && (
                <div css={tw`bg-gray-800 p-2`}>
                    <button onClick={() => handleLoginAsUser()} css={tw`bg-blue-500 text-white p-2 rounded m-2`}>Login User</button>
                    <button onClick={() => handleLoginAsAdmin()} css={tw`bg-blue-500 text-white p-2 rounded m-2`}>Login Admin</button>
                    <button onClick={() => handleLoginAsSuperAdmin()} css={tw`bg-purple-500 text-white p-2 rounded m-2`}>Login Super Admin</button>
                </div>
            )}
        </>
    );
};

export default DevToolBar;
