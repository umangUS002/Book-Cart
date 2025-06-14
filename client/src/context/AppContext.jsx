import { createContext, useContext, useEffect, useState } from "react";
import {useNavigate} from 'react-router-dom';
import toast from "react-hot-toast";
import { assets } from "../assets/assets";
import axios from "axios";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const AppContext = createContext();

export const AppProvider = ({children}) => {

    const navigate = useNavigate();

    const [token, setToken] = useState(null);
    const [input, setInput] = useState("");
    const [books, setBooks] = useState([]);
    const [similarBooks, setSimilarBooks] = useState([]);

    
    const fetchSimilarBooks = async (bookId) => {
    try {
        const { data } = await axios.get(`/api/book/similar-books/${bookId}`);
        if (data.success) {
            setSimilarBooks(data.similarBooks);
        } else {
            toast.error(data.message);
        }
    } catch (error) {
        toast.error(error.message);
    }
};

    const fetchBooks = async() => {
        try {
            const {data} = await axios.get('/api/book/all');
            data.success ? setBooks(data.books) : toast.error(data.message)
        } catch (error) {
            toast.error(error.message);
        }
    }

    useEffect(()=>{
        fetchBooks();
        const token = localStorage.getItem('token')
        if(token){
            setToken(token);
            axios.defaults.headers.common['Authorization'] = `${token}`;
        }
    },[])

    const value = {
        axios, navigate, token, setToken, input,
        setBooks, setInput, books, fetchBooks,
        similarBooks, setSimilarBooks, fetchSimilarBooks
    }

    return (
        <AppContext.Provider value={value}>
            { children }
        </AppContext.Provider>
    )
}

export const useAppContext = () => {
    return useContext(AppContext)
};