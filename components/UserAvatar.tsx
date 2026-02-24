import React from 'react';

interface UserAvatarProps {
    name?: string;
    avatarUrl?: string | null;
    role?: string;
    className?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg';
}

export default function UserAvatar({ name = 'Usuario', avatarUrl, role, className = '', size = 'md' }: UserAvatarProps) {
    const sizeClasses = {
        xs: 'w-6 h-6 text-[8px]',
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-16 h-16 text-xl',
    };

    const currentSizeClass = sizeClasses[size];
    const initial = name.charAt(0).toUpperCase();

    const isAdmin = role === 'ADMIN';

    if (avatarUrl) {
        return (
            <div className={`shrink-0 rounded-full overflow-hidden border-2 border-white dark:border-slate-800 shadow-md ${currentSizeClass} ${className}`}>
                <img
                    src={avatarUrl}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        // Fallback if image fails to load
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.classList.add('flex', 'items-center', 'justify-center', 'bg-slate-200');
                        (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="font-bold">${initial}</span>`;
                    }}
                />
            </div>
        );
    }

    return (
        <div className={`
      shrink-0 rounded-full flex items-center justify-center font-bold shadow-md transition-transform duration-300
      ${currentSizeClass}
      ${isAdmin
                ? 'bg-gradient-to-br from-medical-500 to-teal-600 text-white ring-2 ring-medical-300/50 dark:ring-medical-500/30'
                : 'bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 text-slate-700 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700'}
      ${className}
    `}>
            {initial}
        </div>
    );
}
