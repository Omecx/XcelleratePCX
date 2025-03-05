import { createContext, useContext, useState } from "react";

const PaginationContext = createContext();

export const usePagination = () => {
    return useContext(PaginationContext);
};

export const PaginationProvider = ({ children }) => {

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    return (
        <PaginationContext.Provider value={{ currentPage, totalPages, handlePageChange, setTotalPages}}>
            { children }
        </PaginationContext.Provider>
    );
};