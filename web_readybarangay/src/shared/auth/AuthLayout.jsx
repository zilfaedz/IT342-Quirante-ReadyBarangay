
import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
    // Track whether the brand animation has already played this session.
    // On first visit: animate. On refresh: skip animation.
    const [animated, setAnimated] = useState(
        () => sessionStorage.getItem('authBrandAnimated') === 'true'
    );

    useEffect(() => {
        if (!animated) {
            // Mark that the animation has now played for this session
            sessionStorage.setItem('authBrandAnimated', 'true');
            setAnimated(true);
        }
    }, [animated]);

    return (
        <div className="split-screen">
            <div className="left-panel">
                <Outlet />
            </div>

            <div className="right-panel">
                <div className="circle circle-1"></div>
                <div className={`brand-content${animated ? ' no-animate' : ''}`}>
                    <h1 className="greeting">Welcome</h1>
                    <h3 className="brand-headline">Your Headline Name</h3>
                    <p className="brand-tagline">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam fermentum vehicula dui, non feugiat nibh euismod vitae.</p>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
