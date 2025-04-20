import { createContext, useContext, useState, ReactNode } from 'react';

type User = {
    id: string;
    name: string;
    email: string;
} | null;

type UserContextType = {
    user: User;
    login: (userData: {id: string; name: string; email: string}) => void;
    logout: () => void;
    isLoggedIn: boolean;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

type UserProviderProps = {
    children: ReactNode;
};

export function UserProvider({ children }: UserProviderProps) {
    const [user, setUser] = useState<User>(null);

    const login = (userData: { id: string; name: string; email: string }) => {
        setUser(userData);
    }

    const logout = () => {
        setUser(null);
    }

    const isLoggedIn = user !== null;

    return (
        <UserContext.Provider value={{user, login, logout, isLoggedIn}}>
            {children}
        </UserContext.Provider>
    );

}

export function useUser() {
    const context = useContext(UserContext);
    return context;
}