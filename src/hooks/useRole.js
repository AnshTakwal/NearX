import { useState, useCallback } from 'react';

export function useRole() {
    const [role, setRole] = useState('customer');

    const switchRole = useCallback((newRole) => {
        setRole(newRole);
    }, []);

    return { role, switchRole };
}
