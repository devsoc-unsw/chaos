import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';

import {
    getSelfInfo
} from "api";

type User = {
    id: string;
    name?: string;
    email: string;
} | null;

type UserContextType = {
    user: User;
    setUser: Dispatch<SetStateAction<User>>;
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

    useEffect(() => {
        (async () => {
          try {
            const u = await getSelfInfo();        // 200 if signed-in
            setUser({
              id: u.id.toString(),
              name: u.name,
              email: u.email,
            });
          } catch {
            setUser(null);                        // 401 or network → guest
          }
        })();
      }, []);
    
    const login = (u: NonNullable<User>) => setUser(u);
    const logout = () => setUser(null);

    const isLoggedIn = user !== null;

    return (
        <UserContext.Provider value={{user, setUser, login, logout, isLoggedIn}}>
            {children}
        </UserContext.Provider>
    );

}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('User can only exist within UserProvider');
    }
    return context;
}