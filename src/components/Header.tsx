import React from 'react';

interface HeaderProps {
    title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
    return (
        <header className="bg-white shadow-sm sticky top-0 z-10 p-4">
            <h1 className="text-2xl font-bold text-center text-primary">{title}</h1>
        </header>
    );
}

export default Header;
