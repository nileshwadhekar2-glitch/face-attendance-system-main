import React, { useState, useEffect } from 'react';
import Register from './Register';
import MobileEnroll from './MobileEnroll';

function AdaptiveEnroll() {
    // Screen-size listener hook to detect phones and tablets
    const [isMobileOrTablet, setIsMobileOrTablet] = useState(window.innerWidth <= 1024);

    useEffect(() => {
        const handleResize = () => {
            setIsMobileOrTablet(window.innerWidth <= 1024);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Responsive switch
    return isMobileOrTablet ? <MobileEnroll /> : <Register />;
}

export default AdaptiveEnroll;
