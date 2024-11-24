import React from "react";
import Form from "next/form";
import { Search } from "lucide-react";

const SearchBar = () => {
  return (
    <div>
      <Form action={"/search"} className="relative">
        <input
          type="text"
          name="q"
          id="search"
          placeholder="Search for events..."
          className="w-full py-3 px-4 pl-12 rounded-lg bg-white shadow-sm focus:outline-none border border-gray-200 focus:border-transparent transition-all duration-200 focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50"
        />
        <Search className="absolute left-4 top-1/2 text-gray-400 w-5 h-5 -translate-y-1/2" />
        <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg text-sm font-medium text-white px-4 py-1.5 hover:bg-blue-700 transition-colors duration-200 bg-blue-500">Search</button>
      </Form>
    </div>
  );
};

export default SearchBar;
