import React, { useContext, useState, createContext } from "react";

const ToggleContext = createContext();

export const ToggleContextProvider = ({ children }) => {

    const [isToggled, setIsToggled] = useState(true);

    const toggle = () => {
        setIsToggled((prevIsToggled) => !prevIsToggled);
        // console.log("tingle")
    };

    return (
        <ToggleContext.Provider value={{ isToggled, toggle }}>
            {children}        
        </ToggleContext.Provider>
    );
};

export const useToggleContext = () => {
    return useContext(ToggleContext);
};

