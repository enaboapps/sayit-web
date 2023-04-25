import React from "react";
import BaseLayout from "../../layout/BaseLayout";
import Auth from "../../business-logic/backend/Auth";
import { Link } from "react-router-dom";

class HomePage extends React.Component {
    // Just render an empty div inside BaseLayout
    render() {
        return (
            <BaseLayout>
                <div>
                    <h1>Home</h1>
                </div>
            </BaseLayout>
        );
    }
}

export default HomePage;