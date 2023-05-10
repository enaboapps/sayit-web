// This component is used in all pages 
// It will contain the Header component on the top

import React from 'react';
import Header from '../header/Header';

type BaseLayoutProps = {
    children: React.ReactNode;
};

function BaseLayout(props: BaseLayoutProps) {
    return (
        <div>
            <Header />
            {props.children}
        </div>
    );
}

export default BaseLayout;