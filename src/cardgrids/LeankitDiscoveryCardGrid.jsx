import React from "react";
import WidgetLeankitCardList from "../widgets/WidgetLeankitCardList";

import CardGrid from "../components/cardGrid";

class LeankitDiscoveryCardGrid extends React.Component {
    constructor(props) {
        super(props);
        props.changeParentPageTitle("Leankit Discovery Dashboard");
    }

    componentDidMount() {}

    render() {
        return (
            <div>
                <CardGrid rows="10" columns="12">
                    <WidgetLeankitCardList color="black" position="span 10 / span 10" instance={this.props.leankit_instance} />
                </CardGrid>
            </div>
        );
    }
}

export default LeankitDiscoveryCardGrid;