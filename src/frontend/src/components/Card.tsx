import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = "", onClick }) => (
    <div
        className={`bg-surface rounded-xl border border-gray-700/50 shadow-lg ${className}`}
        onClick={onClick}
    >
        {children}
    </div>
);
